const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const ACCESS_TOKEN_KEY = 'worksauto_access_token';
const REFRESH_TOKEN_KEY = 'worksauto_refresh_token';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  data?: any;

  constructor(message: string, statusCode: number, errorCode?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;
  }
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    if (typeof window !== 'undefined') {
      const errData = await response.json().catch(() => ({}));
      const errMsg = (errData.message || '').toLowerCase();
      const isSuspended = errMsg.includes('askıya') || errMsg.includes('lisans') || errMsg.includes('aktif değil');

      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('worksauto_auth_session');
      if (!window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/sign-in')) {
        window.location.href = isSuspended ? '/sign-in?suspended=true' : '/sign-in';
      }
    }
    throw new Error('Refresh token expired or invalid');
  }

  const data = await response.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
  }

  return data.accessToken;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers = {}, ...rest } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  try {
    const response = await fetch(url, {
      headers: requestHeaders,
      ...rest,
    });

    // Handle 401 on Super Admin endpoints separately: redirect to /admin/login instead of /sign-in
    if (response.status === 401 && endpoint.includes('/admin/')) {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('worksauto_admin_token');
        localStorage.removeItem('worksauto_admin_user');
        window.location.href = '/admin/login';
      }
      const errData = await response.json().catch(() => ({}));
      throw new ApiError(errData.message || 'Platform yöneticisi oturumu sonlandı.', 401, errData.errorCode, errData);
    }

    // 401 Unauthorized -> Handle Token Refresh Rotation or Evict Suspended Tenant
    if (response.status === 401 && !endpoint.includes('/auth/') && !endpoint.includes('/admin/')) {
      const errClone = response.clone();
      const errData = await errClone.json().catch(() => ({}));
      const errMsg = (errData.message || '').toLowerCase();
      const isSuspended = errMsg.includes('askıya') || errMsg.includes('lisans') || errMsg.includes('aktif değil');

      if (isSuspended) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem('worksauto_auth_session');
          window.dispatchEvent(new CustomEvent('worksauto:suspended', { detail: { message: errData.message } }));
          if (!window.location.pathname.startsWith('/sign-in') && !window.location.pathname.startsWith('/admin')) {
            window.location.href = '/sign-in?suspended=true';
          }
        }
        throw new ApiError(errData.message || 'Servis lisansı askıya alınmıştır.', 401, 'TENANT_SUSPENDED', errData);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          processQueue(null);

          // Retry with new token
          const retryHeaders = {
            ...requestHeaders,
            Authorization: `Bearer ${newToken}`,
          };
          const retryRes = await fetch(url, {
            headers: retryHeaders,
            ...rest,
          });
          if (!retryRes.ok) {
            const errData = await retryRes.json().catch(() => ({}));
            throw new ApiError(errData.message || 'İstek başarısız oldu.', retryRes.status, errData.errorCode, errData);
          }
          return await retryRes.json();
        } catch (refreshErr: any) {
          isRefreshing = false;
          processQueue(refreshErr);
          throw refreshErr;
        }
      } else {
        // Wait for current refresh to complete
        await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        // Re-read token and retry
        const retryToken = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
        const retryHeaders = {
          ...requestHeaders,
          ...(retryToken ? { Authorization: `Bearer ${retryToken}` } : {}),
        };
        const retryRes = await fetch(url, {
          headers: retryHeaders,
          ...rest,
        });
        if (!retryRes.ok) {
          const errData = await retryRes.json().catch(() => ({}));
          throw new ApiError(errData.message || 'İstek başarısız oldu.', retryRes.status, errData.errorCode, errData);
        }
        return await retryRes.json();
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new ApiError(
        errData.message || 'İşlem sırasında bir hata oluştu.',
        response.status,
        errData.errorCode,
        errData
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Sunucuya bağlanılamadı.', 500);
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

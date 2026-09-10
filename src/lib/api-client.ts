const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const ACCESS_TOKEN_KEY = 'worksauto_access_token';
const REFRESH_TOKEN_KEY = 'worksauto_refresh_token';

let inMemoryTenantToken: string | null = null;
let inMemoryAdminToken: string | null = null;

export function getAccessToken(endpoint?: string): string | null {
  if (typeof window !== 'undefined') {
    const isAdmin = Boolean(
      (endpoint && endpoint.includes('/admin')) ||
      window.location.pathname.startsWith('/admin')
    );

    if (isAdmin) {
      if (inMemoryAdminToken) return inMemoryAdminToken;
      const adminToken = localStorage.getItem('worksauto_admin_token');
      if (adminToken) {
        inMemoryAdminToken = adminToken;
        return adminToken;
      }
      return null;
    }
  }

  if (inMemoryTenantToken) return inMemoryTenantToken;
  if (typeof window !== 'undefined') {
    const legacy = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (legacy) {
      inMemoryTenantToken = legacy;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      return legacy;
    }
  }
  return null;
}

export function setAccessToken(token: string | null): void {
  inMemoryTenantToken = token;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setSessionCookie(Boolean(token));
  }
}

export function setAdminToken(token: string | null): void {
  inMemoryAdminToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('worksauto_admin_token', token);
    } else {
      localStorage.removeItem('worksauto_admin_token');
    }
  }
}

export function setSessionCookie(active: boolean) {
  if (typeof document === 'undefined') return;
  if (active) {
    const isProd = process.env.NODE_ENV === 'production';
    document.cookie = `worksauto_session=1; path=/; SameSite=Lax${isProd ? '; Secure' : ''}; max-age=${30 * 24 * 60 * 60}`;
  } else {
    document.cookie = 'worksauto_session=; path=/; SameSite=Lax; max-age=0';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
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
  data?: unknown;

  constructor(message: string, statusCode: number, errorCode?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;
  }
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const legacyRefreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {}),
      });

      if (!response.ok) {
        if (typeof window !== 'undefined') {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData.message || '').toLowerCase();
          const isSuspended = errMsg.includes('askıya') || errMsg.includes('lisans') || errMsg.includes('aktif değil');

          setAccessToken(null);
          setSessionCookie(false);
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
      setAccessToken(data.accessToken);
      setSessionCookie(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }

      return data.accessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T = unknown>(
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

  const token = getAccessToken(endpoint);
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      headers: requestHeaders,
      credentials: 'include',
      ...rest,
    });

    // Handle 401 / 403 on Super Admin endpoints separately: redirect to /admin/login instead of /sign-in
    if ((response.status === 401 || response.status === 403) && endpoint.includes('/admin/')) {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('worksauto_admin_user');
        localStorage.removeItem('worksauto_admin_token');
        inMemoryAdminToken = null;
        window.location.href = '/admin/login';
      }
      const errData = await response.json().catch(() => ({}));
      throw new ApiError(errData.message || 'Platform yöneticisi oturumu sonlandı.', response.status, errData.errorCode, errData);
    }

    // 401 Unauthorized -> Handle Token Refresh Rotation or Evict Suspended Tenant
    if (response.status === 401 && !endpoint.includes('/auth/') && !endpoint.includes('/admin/')) {
      const errClone = response.clone();
      const errData = await errClone.json().catch(() => ({}));
      const errMsg = (errData.message || '').toLowerCase();
      const isSuspended = errMsg.includes('askıya') || errMsg.includes('lisans') || errMsg.includes('aktif değil');

      if (isSuspended) {
        if (typeof window !== 'undefined') {
          setAccessToken(null);
          setSessionCookie(false);
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
            credentials: 'include',
            ...rest,
          });
          if (!retryRes.ok) {
            const errData = await retryRes.json().catch(() => ({}));
            throw new ApiError(errData.message || 'İstek başarısız oldu.', retryRes.status, errData.errorCode, errData);
          }
          return await retryRes.json();
        } catch (refreshErr: unknown) {
          isRefreshing = false;
          processQueue(refreshErr instanceof Error ? refreshErr : new Error(String(refreshErr)));
          throw refreshErr;
        }
      } else {
        // Wait for current refresh to complete
        await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        // Re-read in-memory token and retry
        const retryToken = getAccessToken();
        const retryHeaders = {
          ...requestHeaders,
          ...(retryToken ? { Authorization: `Bearer ${retryToken}` } : {}),
        };
        const retryRes = await fetch(url, {
          headers: retryHeaders,
          credentials: 'include',
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
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Sunucuya bağlanılamadı.';
    throw new ApiError(message, 500);
  }
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });
  },

  upload: <T = unknown>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

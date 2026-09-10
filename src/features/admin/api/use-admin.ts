import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient, setAdminToken } from '@/lib/api-client';

const ADMIN_USER_KEY = 'worksauto_admin_user';

export interface AdminUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN';
}

export interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants?: number;
  suspendedTenants?: number;
  totalWorkOrders: number;
  totalCustomers?: number;
  totalUsers?: number;
  totalPlatformVolume?: number | string;
}

export interface AdminTenantListItem {
  id: string;
  title: string;
  legalName?: string;
  owner?: string;
  ownerPhone?: string;
  city?: string;
  district?: string;
  isActive: boolean;
  createdAt: string;
  stats?: {
    totalStaff?: number;
    totalWorkOrders?: number;
  };
}

export interface AdminTenantDetail {
  id: string;
  title: string;
  legalName?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  address?: string;
  taxNumber?: string;
  taxOffice?: string;
  isActive: boolean;
  createdAt: string;
  users?: Array<{
    id: string;
    name: string;
    surname?: string;
    phone: string;
    role: string;
    isActive: boolean;
  }>;
  _count?: {
    workOrders?: number;
    customers?: number;
    vehicles?: number;
  };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityName?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    surname?: string;
    role: string;
  } | null;
  tenant?: {
    id: string;
    title: string;
  } | null;
  changesBefore?: Record<string, unknown>;
  changesAfter?: Record<string, unknown>;
}

export interface AuditLogsResponse {
  data: AuditLogEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminHealthResponse {
  status: string;
  database?: {
    latencyMs?: number;
    status?: string;
  };
  redis?: {
    latencyMs?: number;
    status?: string;
  };
}

export interface AdminLoginResponse {
  success?: boolean;
  accessToken?: string;
  user: AdminUser;
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAdminSession(user: AdminUser, accessToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  if (accessToken) {
    setAdminToken(accessToken);
  }
  const isProd = process.env.NODE_ENV === 'production';
  document.cookie = `worksauto_admin_session=1; path=/; SameSite=Lax${isProd ? '; Secure' : ''}; max-age=${24 * 60 * 60}`;
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_USER_KEY);
  setAdminToken(null);
  document.cookie = 'worksauto_admin_session=; path=/; SameSite=Lax; max-age=0';
}

export function useAdminStats() {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get<AdminStats>('/admin/stats'),
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function useAdminTenants(params?: { status?: string; search?: string; city?: string }) {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-tenants', params],
    queryFn: () =>
      apiClient.get<AdminTenantListItem[]>('/admin/tenants', {
        params,
      }),
    enabled: !!user,
  });
}

export function useAdminTenantDetail(id?: string) {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-tenants', id],
    queryFn: () => apiClient.get<AdminTenantDetail>(`/admin/tenants/${id}`),
    enabled: !!user && !!id,
  });
}

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive, reason }: { id: string; isActive: boolean; reason?: string }) =>
      apiClient.patch(`/admin/tenants/${id}/status`, { isActive, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

export interface CreateTenantInput {
  title: string;
  legalName?: string;
  ownerName: string;
  ownerSurname: string;
  phone: string;
  email: string;
  city?: string;
  district?: string;
  address?: string;
  taxNumber?: string;
  taxOffice?: string;
  isActive?: boolean;
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantInput) => apiClient.post('/admin/tenants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => apiClient.delete(`/admin/tenants/${tenantId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

export function useAdminAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  search?: string;
}) {
  const user = getAdminUser();
  const page = params?.page ? Number(params.page) : 1;
  const limit = params?.limit ? Number(params.limit) : 10;
  const action = params?.action || 'ALL';
  const search = params?.search?.trim() || '';

  return useQuery({
    queryKey: ['admin-audit-logs', page, limit, action, search],
    queryFn: () =>
      apiClient.get<AuditLogsResponse>('/admin/audit-logs', {
        params: {
          page,
          limit,
          action,
          search: search || undefined,
        },
      }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
    retry: 1,
  });
}

export function useAdminHealth() {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-health'],
    queryFn: () => apiClient.get<AdminHealthResponse>('/admin/health'),
    enabled: !!user,
    refetchInterval: 10000,
  });
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiClient.post<AdminLoginResponse>('/admin/auth/login', credentials);
      if (res?.user) {
        setAdminSession(res.user, res.accessToken);
      }
      return res;
    },
  });
}

export function useAdminLogout() {
  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post('/admin/auth/logout');
      } finally {
        clearAdminSession();
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
      }
    },
  });
}

// -------------------------------------------------------------
// SUPER ADMIN PLATFORM USERS HOOKS
// -------------------------------------------------------------

export interface SuperAdminUserRecord {
  id: string;
  email: string;
  phone: string;
  name: string;
  surname?: string | null;
  role: 'SUPER_ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSuperAdminInput {
  email: string;
  password: string;
  name: string;
  surname?: string;
  phone: string;
}

export function useSuperAdmins() {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-superadmins'],
    queryFn: () => apiClient.get<SuperAdminUserRecord[]>('/admin/users'),
    enabled: !!user,
    refetchInterval: 20000,
  });
}

export function useCreateSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSuperAdminInput) =>
      apiClient.post<SuperAdminUserRecord>('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-superadmins'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

export function useUpdateSuperAdminStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch<SuperAdminUserRecord>(`/admin/users/${id}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-superadmins'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

export function useDeleteSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ success: boolean; message: string }>(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-superadmins'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

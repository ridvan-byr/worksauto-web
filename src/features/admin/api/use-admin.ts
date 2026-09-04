import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const ADMIN_TOKEN_KEY = 'worksauto_admin_token';
const ADMIN_USER_KEY = 'worksauto_admin_user';

export interface AdminUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN';
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
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

export function setAdminSession(token: string, user: AdminUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function useAdminStats() {
  const token = getAdminToken();
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () =>
      apiClient.get<any>('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token,
    refetchInterval: 15000,
  });
}

export function useAdminTenants(params?: { status?: string; search?: string; city?: string }) {
  const token = getAdminToken();
  return useQuery({
    queryKey: ['admin-tenants', params],
    queryFn: () =>
      apiClient.get<any[]>('/admin/tenants', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token,
  });
}

export function useAdminTenantDetail(id?: string) {
  const token = getAdminToken();
  return useQuery({
    queryKey: ['admin-tenants', id],
    queryFn: () =>
      apiClient.get<any>(`/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token && !!id,
  });
}

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient();
  const token = getAdminToken();
  return useMutation({
    mutationFn: ({ id, isActive, reason }: { id: string; isActive: boolean; reason?: string }) =>
      apiClient.patch(
        `/admin/tenants/${id}/status`,
        { isActive, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      ),
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
  const token = getAdminToken();
  return useMutation({
    mutationFn: (data: CreateTenantInput) =>
      apiClient.post(
        '/admin/tenants',
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  const token = getAdminToken();
  return useMutation({
    mutationFn: (tenantId: string) =>
      apiClient.delete(
        `/admin/tenants/${tenantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

export interface AuditLogsResponse {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useAdminAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  search?: string;
}) {
  const token = getAdminToken();
  return useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () =>
      apiClient.get<AuditLogsResponse>('/admin/audit-logs', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token,
    refetchInterval: 10000,
  });
}

export function useAdminHealth() {
  const token = getAdminToken();
  return useQuery({
    queryKey: ['admin-health'],
    queryFn: () =>
      apiClient.get<any>('/admin/health', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token,
    refetchInterval: 10000,
  });
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return apiClient.post<any>('/admin/auth/login', credentials);
    },
  });
}

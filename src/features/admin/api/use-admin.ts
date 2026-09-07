import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const ADMIN_USER_KEY = 'worksauto_admin_user';

export interface AdminUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN';
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

export function setAdminSession(user: AdminUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function useAdminStats() {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get<any>('/admin/stats'),
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function useAdminTenants(params?: { status?: string; search?: string; city?: string }) {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-tenants', params],
    queryFn: () =>
      apiClient.get<any[]>('/admin/tenants', {
        params,
      }),
    enabled: !!user,
  });
}

export function useAdminTenantDetail(id?: string) {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-tenants', id],
    queryFn: () => apiClient.get<any>(`/admin/tenants/${id}`),
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
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () => apiClient.get<AuditLogsResponse>('/admin/audit-logs', { params }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    refetchInterval: 10000,
  });
}

export function useAdminHealth() {
  const user = getAdminUser();
  return useQuery({
    queryKey: ['admin-health'],
    queryFn: () => apiClient.get<any>('/admin/health'),
    enabled: !!user,
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

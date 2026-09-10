import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export interface TenantAuditLogRecord {
  id: string;
  action: string;
  entityName?: string;
  entityId?: string;
  userId?: string;
  userAgent?: string;
  changesBefore?: Record<string, unknown>;
  changesAfter?: Record<string, unknown>;
  createdAt: string;
  user?: { name: string; surname?: string; role?: string };
  ipAddress?: string;
  details?: Record<string, unknown>;
}

export interface TenantAuditLogsResponse {
  data: Array<TenantAuditLogRecord>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
  page?: number;
  totalPages?: number;
}

export function useTenantAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  entityName?: string;
  search?: string;
}) {
  const page = params?.page ? Number(params.page) : 1;
  const limit = params?.limit ? Number(params.limit) : 15;
  const action = params?.action || 'ALL';
  const entityName = params?.entityName || '';
  const search = params?.search?.trim() || '';

  return useQuery({
    queryKey: ['tenant-audit-logs', page, limit, action, entityName, search],
    queryFn: () =>
      apiClient.get<TenantAuditLogsResponse>('/audit-logs', {
        params: {
          page,
          limit,
          action: action !== 'ALL' ? action : undefined,
          entityName: entityName || undefined,
          search: search || undefined,
        },
      }),
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export interface ServiceRecord {
  id: string;
  name: string;
  category?: string;
  basePrice?: number;
  estimatedMinutes?: number;
  defaultDurationMin?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface CreateServiceInput {
  name: string;
  category?: string;
  basePrice: number;
  estimatedMinutes?: number;
  isActive?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  category?: string;
  basePrice?: number;
  defaultDurationMin?: number;
  isActive?: boolean;
}

export function useServices(params?: { search?: string; category?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => apiClient.get<ServiceRecord[]>('/services', { params }),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceInput) => apiClient.post<ServiceRecord>('/services', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Hizmet tanımı başarıyla kaydedildi.', {
        description: data?.name ? `${data.name} hizmet listesine eklendi.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Hizmet kaydedilemedi.';
      toast.error(message);
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceInput }) =>
      apiClient.patch<ServiceRecord>(`/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Hizmet bilgileri güncellendi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Hizmet güncellenemedi.';
      toast.error(message);
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Hizmet başarıyla kaldırıldı.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Hizmet kaldırılamadı.';
      toast.error(message);
    },
  });
}

export interface StaffRecord {
  id: string;
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  assignedLift?: string;
  specialty?: string;
  user?: {
    id: string;
    name: string;
    surname?: string;
    phone: string;
    email?: string;
    role: string;
    isActive?: boolean;
    mechanic?: {
      assignedLift?: string;
      specialty?: string;
    };
  };
  mechanic?: {
    assignedLift?: string;
    specialty?: string;
  };
}

export interface CreateStaffInput {
  name: string;
  surname?: string;
  phone: string;
  email?: string;
  role: string;
  assignedLift?: string | null;
  specialty?: string;
}

export interface UpdateStaffInput {
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
  role?: string;
  assignedLift?: string | null;
  specialty?: string;
  isActive?: boolean;
}

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => apiClient.get<StaffRecord[]>('/staff'),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInput) => apiClient.post<StaffRecord>('/staff', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel başarıyla eklendi.', {
        description: data?.name ? `${data.name} ${data.surname || ''} kadroya dahil edildi.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Personel eklenemedi.';
      toast.error(message);
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffInput }) =>
      apiClient.patch<StaffRecord>(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel bilgileri güncellendi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Personel güncellenemedi.';
      toast.error(message);
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel kaydı başarıyla silindi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Personel silinemedi.';
      toast.error(message);
    },
  });
}

export interface TenantSettings {
  id: string;
  title: string;
  legalName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  taxOffice?: string;
  taxNumber?: string;
  autoInvoiceOnComplete?: boolean;
}

export function useTenantSettings() {
  return useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => apiClient.get<TenantSettings>('/tenants/current'),
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TenantSettings>) => apiClient.patch<TenantSettings>('/tenants/current', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      toast.success('Atölye ayarları başarıyla güncellendi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Ayarlar kaydedilemedi.';
      toast.error(message);
    },
  });
}

// -------------------------------------------------------------
// WORKSHOP BAYS & LIFTS
// -------------------------------------------------------------

export interface WorkshopBayRecord {
  id: string;
  tenantId: string;
  name: string;
  code?: string | null;
  category: string;
  isActive: boolean;
  isAvailableForOnline: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkshopBayInput {
  name: string;
  code?: string;
  category?: string;
  isAvailableForOnline?: boolean;
  orderIndex?: number;
}

export interface UpdateWorkshopBayInput {
  name?: string;
  code?: string;
  category?: string;
  isActive?: boolean;
  isAvailableForOnline?: boolean;
  orderIndex?: number;
}

export function useWorkshopBays() {
  return useQuery({
    queryKey: ['workshop-bays'],
    queryFn: () => apiClient.get<WorkshopBayRecord[]>('/tenants/bays'),
  });
}

export function useCreateWorkshopBay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkshopBayInput) => apiClient.post<WorkshopBayRecord>('/tenants/bays', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workshop-bays'] });
      toast.success('İstasyon / Lift başarıyla eklendi', {
        description: `${data.name} atölye kapasitesine tanımlandı.`,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'İstasyon eklenirken hata oluştu.';
      toast.error(message);
    },
  });
}

export function useUpdateWorkshopBay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkshopBayInput }) =>
      apiClient.patch<WorkshopBayRecord>(`/tenants/bays/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-bays'] });
      toast.success('İstasyon / Lift bilgileri güncellendi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'İstasyon güncellenemedi.';
      toast.error(message);
    },
  });
}

export function useDeleteWorkshopBay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tenants/bays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-bays'] });
      toast.success('İstasyon / Lift kaydı silindi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'İstasyon silinemedi.';
      toast.error(message);
    },
  });
}


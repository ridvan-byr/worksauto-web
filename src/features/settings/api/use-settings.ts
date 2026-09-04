import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export function useServices(params?: { search?: string; category?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => apiClient.get<any[]>('/services', { params }),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/services', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Hizmet tanımı başarıyla kaydedildi.', {
        description: data?.name ? `${data.name} hizmet listesine eklendi.` : undefined,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hizmet kaydedilemedi.');
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.patch(`/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Hizmet bilgileri güncellendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hizmet güncellenemedi.');
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
    onError: (err: any) => {
      toast.error(err?.message || 'Hizmet kaldırılamadı.');
    },
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => apiClient.get<any[]>('/staff'),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/staff', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel başarıyla eklendi.', {
        description: data?.name ? `${data.name} ${data.surname || ''} kadroya dahil edildi.` : undefined,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Personel eklenemedi.');
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.patch(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel bilgileri güncellendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Personel güncellenemedi.');
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
    onError: (err: any) => {
      toast.error(err?.message || 'Personel silinemedi.');
    },
  });
}

export function useTenantSettings() {
  return useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => apiClient.get<any>('/tenants/current'),
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.patch('/tenants/current', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      toast.success('Atölye ayarları başarıyla güncellendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Ayarlar kaydedilemedi.');
    },
  });
}

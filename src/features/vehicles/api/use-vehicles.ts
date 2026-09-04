import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export function useVehicles(customerId?: string) {
  return useQuery({
    queryKey: ['vehicles', customerId],
    queryFn: () => apiClient.get<any[]>('/vehicles', { params: { customerId } }),
  });
}

export function useVehicle(id?: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => apiClient.get<any>(`/vehicles/${id}`),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/vehicles', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Araç kaydı başarıyla eklendi.', {
        description: data?.plate ? `${data.plate} sisteme bağlandı.` : undefined,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Araç kaydedilemedi. Bu plaka zaten kayıtlı olabilir.');
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Araç başarıyla silindi ve arşivlendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Araç silinemedi. Bağlı iş emirleri bulunuyor olabilir.');
    },
  });
}

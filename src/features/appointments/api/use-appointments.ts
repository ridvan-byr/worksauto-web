import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export function useAppointments(date?: string) {
  return useQuery({
    queryKey: ['appointments', date],
    queryFn: () => apiClient.get<any[]>('/appointments', { params: { date } }),
  });
}

export function useAppointment(id?: string) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => apiClient.get<any>(`/appointments/${id}`),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Randevu kaydı başarıyla oluşturuldu.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Randevu kaydedilemedi. Lütfen saat ve müşteri bilgilerini kontrol edin.');
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cancellationReason }: { id: string; status: string; cancellationReason?: string }) =>
      apiClient.patch(`/appointments/${id}/status`, { status, cancellationReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Randevu durumu güncellendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Randevu durumu güncellenemedi.');
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/appointments/${id}/no-show`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.warning('Müşteri randevuya gelmedi (No-Show) olarak işaretlendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'İşlem gerçekleştirilemedi.');
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/appointments/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.info('Randevu başarıyla iptal edildi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Randevu iptal edilirken hata oluştu.');
    },
  });
}

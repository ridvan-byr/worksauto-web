import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';
import { Appointment, AppointmentStatus } from '../types';
import { AppointmentCreateValues } from '../schemas/appointment.schema';

export function useAppointments(date?: string) {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', date],
    queryFn: () => apiClient.get<Appointment[]>('/appointments', { params: { date } }),
  });
}

export function useAppointment(id?: string) {
  return useQuery<Appointment>({
    queryKey: ['appointments', id],
    queryFn: () => apiClient.get<Appointment>(`/appointments/${id}`),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation<Appointment, Error, AppointmentCreateValues>({
    mutationFn: (data: AppointmentCreateValues) => apiClient.post<Appointment>('/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Randevu kaydı başarıyla oluşturuldu.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Randevu kaydedilemedi. Lütfen saat ve müşteri bilgilerini kontrol edin.');
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation<Appointment, Error, { id: string; status: AppointmentStatus | string; cancellationReason?: string }>({
    mutationFn: ({ id, status, cancellationReason }) =>
      apiClient.patch<Appointment>(`/appointments/${id}/status`, { status, cancellationReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Randevu durumu güncellendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Randevu durumu güncellenemedi.');
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();
  return useMutation<Appointment, Error, string>({
    mutationFn: (id: string) => apiClient.patch<Appointment>(`/appointments/${id}/no-show`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.warning('Müşteri randevuya gelmedi (No-Show) olarak işaretlendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'İşlem gerçekleştirilemedi.');
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation<Appointment, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiClient.patch<Appointment>(`/appointments/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.info('Randevu başarıyla iptal edildi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Randevu iptal edilirken hata oluştu.');
    },
  });
}

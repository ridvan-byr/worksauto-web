import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['customers', search],
    queryFn: () => apiClient.get<any[]>('/customers', { params: { search } }),
  });
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => apiClient.get<any>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCustomerStats(id?: string) {
  return useQuery({
    queryKey: ['customers', id, 'stats'],
    queryFn: () => apiClient.get<any>(`/customers/${id}/stats`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/customers', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Müşteri başarıyla kaydedildi.', {
        description: data?.firstName ? `${data.firstName} ${data.lastName || ''} müşteri rehberine eklendi.` : undefined,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Müşteri oluşturulurken bir hata oluştu.');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/customers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
      toast.success('Müşteri bilgileri güncellendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Müşteri bilgileri güncellenemedi.');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Müşteri kaydı silindi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Müşteri silinemedi.');
    },
  });
}

export function useAnonymizeCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, legalRef }: { id: string; legalRef: string }) =>
      apiClient.post(`/customers/${id}/anonymize`, { legalRef }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.info('KVKK kapsamında müşteri kaydı anonimleştirildi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Anonimleştirme işlemi başarısız.');
    },
  });
}

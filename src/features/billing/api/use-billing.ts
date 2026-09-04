import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export function useInvoices(status?: string) {
  return useQuery({
    queryKey: ['invoices', status],
    queryFn: () => apiClient.get<any[]>('/invoices', { params: { status } }),
  });
}

export function useInvoice(id?: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => apiClient.get<any>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/invoices', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['current-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Fatura taslağı başarıyla oluşturuldu.', {
        description: data?.invoiceNumber ? `${data.invoiceNumber} cari hesaba işlendi.` : undefined,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Fatura oluşturulamadı.');
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/invoices/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['current-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.info('Fatura iptal edildi ve cari hesap bakiyesi dengelendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Fatura iptal edilemedi.');
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => apiClient.get<any[]>('/payments'),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/payments', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['current-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Tahsilat başarıyla kaydedildi.', {
        description: data?.amount ? `${Number(data.amount).toLocaleString('tr-TR')} ₺ hesaba işlendi.` : undefined,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Tahsilat kaydedilemedi.');
    },
  });
}

export function useDailySummary() {
  return useQuery({
    queryKey: ['payments', 'daily-summary'],
    queryFn: () => apiClient.get<any>('/payments/daily-summary'),
  });
}

export function useCurrentAccounts() {
  return useQuery({
    queryKey: ['current-accounts'],
    queryFn: () => apiClient.get<any[]>('/current-accounts'),
  });
}

export function useCustomerCurrentAccount(customerId?: string) {
  return useQuery({
    queryKey: ['current-accounts', customerId],
    queryFn: () => apiClient.get<any>(`/current-accounts/customer/${customerId}`),
    enabled: !!customerId,
  });
}

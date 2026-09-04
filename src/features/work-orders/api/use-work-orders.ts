import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export function useWorkOrders(status?: string) {
  return useQuery({
    queryKey: ['work-orders', status],
    queryFn: () => apiClient.get<any[]>('/work-orders', { params: { status } }),
  });
}

export function useWorkOrder(id?: string) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: () => apiClient.get<any>(`/work-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/work-orders', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('İş emri başarıyla açıldı.', {
        description: data?.id ? `İş Emri #${data.id.slice(0, 8)} atölye paneline eklendi.` : undefined,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'İş emri oluşturulurken bir hata oluştu.');
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/work-orders/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['current-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('İş emri aşaması güncellendi.', {
        description: `Yeni Durum: ${variables.status}`,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Durum güncellenirken hata oluştu.');
    },
  });
}

export function useRollbackWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/work-orders/${id}/rollback`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.info('İş emri önceki aşamaya geri alındı.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Geri alma işlemi başarısız oldu.');
    },
  });
}

export function useAddWorkOrderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workOrderId, item }: { workOrderId: string; item: any }) =>
      apiClient.post(`/work-orders/${workOrderId}/items`, item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Hizmet/Parça iş emrine eklendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Kalem eklenirken hata oluştu.');
    },
  });
}

export function useRemoveWorkOrderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workOrderId, itemId }: { workOrderId: string; itemId: string }) =>
      apiClient.delete(`/work-orders/${workOrderId}/items/${itemId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Kalem iş emrinden çıkarıldı.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Kalem silinirken hata oluştu.');
    },
  });
}

export function useAddWorkOrderPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workOrderId, data }: { workOrderId: string; data: any }) =>
      apiClient.post(`/work-orders/${workOrderId}/photos`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      toast.success('Fotoğraf başarıyla yüklendi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Fotoğraf yüklenemedi.');
    },
  });
}

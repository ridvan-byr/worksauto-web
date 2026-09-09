import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';
import { WorkOrder, WorkOrderStatus } from '../types';
import { WorkOrderCreateValues, AddWorkOrderItemFormValues } from '../schemas/work-order.schema';

export function useWorkOrders(status?: WorkOrderStatus | string) {
  return useQuery<WorkOrder[]>({
    queryKey: ['work-orders', status],
    queryFn: () => apiClient.get<WorkOrder[]>('/work-orders', { params: { status } }),
  });
}

export function useWorkOrder(id?: string) {
  return useQuery<WorkOrder>({
    queryKey: ['work-orders', id],
    queryFn: () => apiClient.get<WorkOrder>(`/work-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, WorkOrderCreateValues>({
    mutationFn: (data: WorkOrderCreateValues) => apiClient.post<WorkOrder>('/work-orders', data),
    onSuccess: (data: WorkOrder) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('İş emri başarıyla açıldı.', {
        description: data?.id ? `İş Emri #${data.id.slice(0, 8)} atölye paneline eklendi.` : undefined,
      });
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'İş emri oluşturulurken bir hata oluştu.');
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, { id: string; status: WorkOrderStatus | string }>({
    mutationFn: ({ id, status }) =>
      apiClient.patch<WorkOrder>(`/work-orders/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['current-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('İş emri aşaması güncellendi.', {
        description: `Yeni Durum: ${variables.status}`,
      });
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Durum güncellenirken hata oluştu.');
    },
  });
}

export function useRollbackWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, string>({
    mutationFn: (id: string) => apiClient.post<WorkOrder>(`/work-orders/${id}/rollback`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.info('İş emri önceki aşamaya geri alındı.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Geri alma işlemi başarısız oldu.');
    },
  });
}

export function useAddWorkOrderItem() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, { workOrderId: string; item: AddWorkOrderItemFormValues }>({
    mutationFn: ({ workOrderId, item }) =>
      apiClient.post<WorkOrder>(`/work-orders/${workOrderId}/items`, item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Hizmet/Parça iş emrine eklendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Kalem eklenirken hata oluştu.');
    },
  });
}

export function useRemoveWorkOrderItem() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, { workOrderId: string; itemId: string }>({
    mutationFn: ({ workOrderId, itemId }) =>
      apiClient.delete<WorkOrder>(`/work-orders/${workOrderId}/items/${itemId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Kalem iş emrinden çıkarıldı.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Kalem silinirken hata oluştu.');
    },
  });
}

export function useAddWorkOrderPhoto() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { workOrderId: string; data: { url: string; caption: string; photoType: string } }>({
    mutationFn: ({ workOrderId, data }) =>
      apiClient.post(`/work-orders/${workOrderId}/photos`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      toast.success('Fotoğraf başarıyla yüklendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Fotoğraf yüklenemedi.');
    },
  });
}

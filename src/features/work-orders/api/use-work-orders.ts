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

export function useUpdateWorkOrderItemQuantity() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, { workOrderId: string; itemId: string; quantity: number }>({
    mutationFn: ({ workOrderId, itemId, quantity }) =>
      apiClient.patch<WorkOrder>(`/work-orders/${workOrderId}/items/${itemId}`, { quantity }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Kalem miktarı güncellendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Kalem miktarı güncellenirken hata oluştu.');
    },
  });
}

export function useUpdateWorkOrderItem() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, { workOrderId: string; itemId: string; data: { name?: string; unitPrice?: number; quantity?: number } }>({
    mutationFn: ({ workOrderId, itemId, data }) =>
      apiClient.patch<WorkOrder>(`/work-orders/${workOrderId}/items/${itemId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('İşçilik/Kalem başarıyla güncellendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Kalem güncellenirken hata oluştu.');
    },
  });
}

export function useAddWorkOrderNote() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { workOrderId: string; text: string; isInternal?: boolean }>({
    mutationFn: ({ workOrderId, text, isInternal }) =>
      apiClient.post(`/work-orders/${workOrderId}/notes`, { text, isInternal }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      toast.success('Not eklendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Not eklenemedi.');
    },
  });
}

export function useUpdateWorkOrderNote() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { workOrderId: string; noteId: string; text: string }>({
    mutationFn: ({ workOrderId, noteId, text }) =>
      apiClient.patch(`/work-orders/${workOrderId}/notes/${noteId}`, { text }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      toast.success('Not güncellendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Not güncellenemedi.');
    },
  });
}

export function useDeleteWorkOrderNote() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { workOrderId: string; noteId: string }>({
    mutationFn: ({ workOrderId, noteId }) =>
      apiClient.delete(`/work-orders/${workOrderId}/notes/${noteId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      toast.success('Not silindi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Not silinemedi.');
    },
  });
}

export function useUploadWorkOrderPhoto() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { workOrderId: string; file: File; caption?: string; photoType?: string }>({
    mutationFn: ({ workOrderId, file, caption, photoType }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) formData.append('caption', caption);
      if (photoType) formData.append('photoType', photoType);
      return apiClient.upload(`/media/work-orders/${workOrderId}/photos`, formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      toast.success('Fotoğraf başarıyla yüklendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Fotoğraf yüklenemedi.');
    },
  });
}

export function useUpdateWorkOrderPhoto() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { workOrderId: string; photoId: string; caption?: string; photoType?: string }>({
    mutationFn: ({ photoId, caption, photoType }) =>
      apiClient.patch(`/media/work-orders/photos/${photoId}`, { caption, photoType }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      toast.success('Fotoğraf bilgileri güncellendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Fotoğraf güncellenemedi.');
    },
  });
}

export function useDeleteWorkOrderPhoto() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { workOrderId: string; photoId: string }>({
    mutationFn: ({ photoId }) =>
      apiClient.delete(`/media/work-orders/photos/${photoId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] });
      toast.success('Fotoğraf silindi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Fotoğraf silinemedi.');
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

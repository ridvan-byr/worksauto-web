import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export function useProducts(params?: { search?: string; category?: string }) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => apiClient.get<any[]>('/inventory', { params }),
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => apiClient.get<any>(`/inventory/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/inventory', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Yeni stok kartı oluşturuldu.', {
        description: data?.name ? `${data.name} envantere eklendi.` : undefined,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Stok kartı kaydedilemedi.');
    },
  });
}

export function useStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      apiClient.post(`/inventory/${productId}/stock-movement`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Stok hareketi başarıyla kaydedildi.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Stok hareketi işlenirken hata oluştu.');
    },
  });
}

export function useProductMovements(productId?: string) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: () => apiClient.get<any[]>(`/inventory/${productId}/movements`),
    enabled: !!productId,
  });
}

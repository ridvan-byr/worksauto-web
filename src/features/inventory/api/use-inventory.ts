import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export interface ProductRecord {
  id: string;
  code: string;
  name: string;
  category?: string;
  brand?: string;
  oemCode?: string;
  stockQuantity: number;
  minStockLevel?: number;
  purchasePrice?: number;
  salePrice: number;
  unit?: string;
  barcode?: string;
  shelfLocation?: string;
  compatibleVehicles?: string[];
}

export interface CreateProductInput {
  code?: string;
  name: string;
  category?: string;
  brand?: string;
  oemCode?: string;
  stockQuantity: number;
  minStockLevel?: number;
  purchasePrice?: number;
  salePrice: number;
  kdvRate?: number;
  unit?: string;
  barcode?: string;
  shelfLocation?: string;
  compatibleVehicles?: string[];
}

export interface StockMovementInput {
  type?: 'IN' | 'OUT' | 'ADJUSTMENT' | string;
  movementType?: 'IN' | 'OUT' | 'ADJUSTMENT' | string;
  quantity: number;
  reason?: string;
  note?: string;
  unitPrice?: number;
  referenceId?: string;
}

export interface StockMovementRecord {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unitPrice?: number;
  reason?: string;
  createdAt: string;
  user?: {
    name: string;
    surname?: string;
  };
}

export function useProducts(params?: { search?: string; category?: string }) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => apiClient.get<ProductRecord[]>('/inventory', { params }),
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => apiClient.get<ProductRecord>(`/inventory/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) => apiClient.post<ProductRecord>('/inventory', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Yeni stok kartı oluşturuldu.', {
        description: data?.name ? `${data.name} envantere eklendi.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Stok kartı kaydedilemedi.';
      toast.error(message);
    },
  });
}

export function useStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: StockMovementInput }) =>
      apiClient.post<{ stockQuantity?: number }>(`/inventory/${productId}/stock-movement`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Stok hareketi başarıyla kaydedildi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Stok hareketi işlenirken hata oluştu.';
      toast.error(message);
    },
  });
}

export function useProductMovements(productId?: string) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: () => apiClient.get<StockMovementRecord[]>(`/inventory/${productId}/movements`),
    enabled: !!productId,
  });
}

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
  aisle?: string;
  rack?: string;
  tier?: string;
  bin?: string;
  shelfCellId?: string;
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
  aisle?: string;
  rack?: string;
  tier?: string;
  bin?: string;
  shelfCellId?: string;
}

export interface CreateShelfInput {
  name: string;
  code: string;
  zone?: string;
  rows: number;
  columns: number;
  description?: string;
}

export interface AssignProductCellInput {
  productId: string;
  shelfCellId?: string | null;
}

export interface ShelfSummaryRecord {
  id: string;
  name: string;
  code: string;
  zone?: string | null;
  rows: number;
  columns: number;
  description?: string | null;
  createdAt: string;
  totalCells: number;
  occupiedCells: number;
  totalProducts: number;
  occupancyRate: number;
}

export interface ShelfProductSummary {
  id: string;
  name: string;
  oemCode?: string | null;
  brand?: string | null;
  category?: string | null;
  stockQuantity: number;
  minStockLevel?: number | null;
  salePrice?: number | null;
  shelfLocation?: string | null;
}

export interface ShelfCellRecord {
  id: string;
  shelfId: string;
  cellCode: string;
  rowNumber: number;
  colNumber: number;
  barcode?: string | null;
  maxCapacity?: number | null;
  products?: ShelfProductSummary[];
}

export interface ShelfDetailRecord {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  zone?: string | null;
  rows: number;
  columns: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  cells: ShelfCellRecord[];
}

export interface AssignCellResult {
  success: boolean;
  product: ProductRecord;
}

export interface DeleteShelfResult {
  success: boolean;
  message: string;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-shelves'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-shelf-matrix'] });
      toast.success('Yeni parça başarıyla envantere eklendi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Parça kaydedilemedi.';
      toast.error(message);
    },
  });
}

export function useStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: StockMovementInput }) =>
      apiClient.post<ProductRecord>(`/inventory/${productId}/stock-movement`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Stok hareketi başarıyla işlendi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Stok hareketi kaydedilemedi.';
      toast.error(message);
    },
  });
}

export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: () => apiClient.get<StockMovementRecord[]>(`/inventory/${productId}/movements`),
    enabled: !!productId,
  });
}

// -------------------------------------------------------------
// WMS SHELF HOOKS
// -------------------------------------------------------------

export function useShelves() {
  return useQuery({
    queryKey: ['inventory-shelves'],
    queryFn: () => apiClient.get<ShelfSummaryRecord[]>('/inventory/shelves'),
  });
}

export function useShelfMatrix(shelfId?: string) {
  return useQuery({
    queryKey: ['inventory-shelf-matrix', shelfId],
    queryFn: () => apiClient.get<ShelfDetailRecord>(`/inventory/shelves/${shelfId}`),
    enabled: !!shelfId,
  });
}

export function useCreateShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShelfInput) => apiClient.post<ShelfDetailRecord>('/inventory/shelves', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-shelves'] });
      toast.success('Yeni raf ünitesi tanımlandı.', {
        description: data?.code ? `${data.code} rafı ve hücreleri oluşturuldu.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Raf kaydedilemedi.';
      toast.error(message);
    },
  });
}

export function useAssignProductCell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignProductCellInput) => apiClient.post<AssignCellResult>('/inventory/shelves/assign-cell', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-shelves'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-shelf-matrix'] });
      toast.success('Parça raf hücresine başarıyla atandı.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Hücre ataması yapılamadı.';
      toast.error(message);
    },
  });
}

export interface BulkAssignProductCellInput {
  productIds: string[];
  shelfCellId?: string | null;
  targetShelfId?: string | null;
}

export interface BulkAssignCellResult {
  success: boolean;
  count: number;
  message?: string;
  cellCode?: string;
  shelfCode?: string;
}

export function useBulkAssignProductCell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkAssignProductCellInput) =>
      apiClient.post<BulkAssignCellResult>('/inventory/shelves/bulk-assign-cell', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-shelves'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-shelf-matrix'] });
      toast.success(data?.message || `${data?.count || 0} adet parça başarıyla taşındı.`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Toplu taşıma işlemi başarısız oldu.';
      toast.error(message);
    },
  });
}

export function useDeleteShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shelfId: string) => apiClient.delete<DeleteShelfResult>(`/inventory/shelves/${shelfId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-shelves'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-shelf-matrix'] });
      toast.success('Raf ünitesi silindi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Raf silinemedi.';
      toast.error(message);
    },
  });
}

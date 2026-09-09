import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export interface VehicleRecord {
  id: string;
  tenantId?: string;
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  currentKm?: number;
  kilometer?: number;
  mileage?: number;
  color?: string;
  engineNo?: string;
  fuelType?: string;
  transmission?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  lastServiceDate?: string;
  customer?: {
    id?: string;
    name?: string;
    surname?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  notes?: string;
  createdAt?: string;
}

export interface CreateVehicleInput {
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  currentKm?: number;
  fuelType?: string;
  transmission?: string;
  customerId: string;
  notes?: string;
}

export interface UpdateVehicleInput {
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  currentKm?: number;
  fuelType?: string;
  transmission?: string;
  notes?: string;
}

export function useVehicles(customerId?: string) {
  return useQuery({
    queryKey: ['vehicles', customerId],
    queryFn: () => apiClient.get<VehicleRecord[]>('/vehicles', { params: { customerId } }),
  });
}

export function useVehicle(id?: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => apiClient.get<VehicleRecord>(`/vehicles/${id}`),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleInput) => apiClient.post<VehicleRecord>('/vehicles', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Araç kaydı başarıyla eklendi.', {
        description: data?.plate ? `${data.plate} sisteme bağlandı.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Araç kaydedilemedi. Bu plaka zaten kayıtlı olabilir.';
      toast.error(message);
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Araç başarıyla silindi ve arşivlendi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Araç silinemedi. Bağlı iş emirleri bulunuyor olabilir.';
      toast.error(message);
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleInput }) =>
      apiClient.put<VehicleRecord>(`/vehicles/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Araç bilgileri başarıyla güncellendi.', {
        description: data?.plate ? `${data.plate} güncellendi.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Araç güncellenirken bir hata oluştu.';
      toast.error(message);
    },
  });
}

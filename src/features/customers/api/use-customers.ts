import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';
import { Customer } from '../types';
import { CustomerFormValues } from '../schemas/customer.schema';

export interface CustomerStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowCount: number;
  noShowRate: string;
  attendanceScore: number;
  riskCategory: string;
  balance: number;
  totalDebits: number;
  totalCredits: number;
  creditLimit: number;
  limitExceeded: boolean;
  totalSpent?: number;
  totalWorkOrders?: number;
  lastServiceDate?: string;
}

export function useCustomers(search?: string) {
  return useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: () => apiClient.get<Customer[]>('/customers', { params: { search } }),
  });
}

export function useCustomer(id?: string) {
  return useQuery<Customer>({
    queryKey: ['customers', id],
    queryFn: () => apiClient.get<Customer>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCustomerStats(id?: string) {
  return useQuery<CustomerStats>({
    queryKey: ['customers', id, 'stats'],
    queryFn: () => apiClient.get<CustomerStats>(`/customers/${id}/stats`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation<Customer, Error, CustomerFormValues>({
    mutationFn: (data: CustomerFormValues) => apiClient.post<Customer>('/customers', data),
    onSuccess: (data: Customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Müşteri başarıyla kaydedildi.', {
        description: data?.name ? `${data.name} ${data.surname || ''} müşteri rehberine eklendi.` : undefined,
      });
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Müşteri oluşturulurken bir hata oluştu.');
    },
  });
}

export interface QuickLeadDto {
  firstName: string;
  lastName?: string;
  phone: string;
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
}

export interface QuickLeadResponse {
  customer: Customer & { firstName?: string; lastName?: string };
  vehicle: {
    id: string;
    plate: string;
    brand?: string;
    model?: string;
    year?: number;
    customerId?: string;
  };
}

export function useQuickLeadCustomer() {
  const queryClient = useQueryClient();
  return useMutation<QuickLeadResponse, Error, QuickLeadDto>({
    mutationFn: (data: QuickLeadDto) => apiClient.post<QuickLeadResponse>('/customers/quick-lead', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Hızlı potansiyel müşteri ve araç kaydı oluşturuldu.', {
        description: `${res.customer.firstName} ${res.customer.lastName || ''} - ${res.vehicle.plate}`,
      });
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Hızlı kayıt oluşturulamadı.');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation<Customer, Error, { id: string; data: Partial<CustomerFormValues> }>({
    mutationFn: ({ id, data }) => apiClient.put<Customer>(`/customers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
      toast.success('Müşteri bilgileri güncellendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Müşteri bilgileri güncellenemedi.');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id: string) => apiClient.delete<{ success: boolean }>(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Müşteri kaydı silindi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Müşteri silinemedi.');
    },
  });
}

export function useAnonymizeCustomer() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; legalRef: string }>({
    mutationFn: ({ id, legalRef }) =>
      apiClient.post<{ success: boolean }>(`/customers/${id}/anonymize`, { legalRef }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.info('KVKK kapsamında müşteri kaydı anonimleştirildi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Anonimleştirme işlemi başarısız.');
    },
  });
}

export interface BatchImportCustomerItem {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  companyTitle?: string;
  type?: 'INDIVIDUAL' | 'CORPORATE';
  taxNumber?: string;
  taxOffice?: string;
  notes?: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  currentKm?: number;
  vin?: string;
  fuelType?: string;
  transmission?: string;
}

export interface BatchImportResult {
  totalRows: number;
  importedCustomersCount: number;
  existingCustomersCount: number;
  updatedCustomersCount?: number;
  importedVehiclesCount: number;
  existingVehiclesCount: number;
  updatedVehiclesCount?: number;
  errors: { row: number; reason: string }[];
}

export function useBatchImportCustomers() {
  const queryClient = useQueryClient();
  return useMutation<BatchImportResult, Error, { items: BatchImportCustomerItem[]; updateExisting?: boolean }>({
    mutationFn: (data) => apiClient.post<BatchImportResult>('/customers/batch-import', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'İçe aktarma işlemi sırasında hata oluştu.');
    },
  });
}

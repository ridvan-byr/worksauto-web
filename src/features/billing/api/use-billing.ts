import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export interface InvoiceItem {
  id?: string;
  name?: string;
  type?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: {
    id?: string;
    name?: string;
    surname?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    taxNumber?: string;
    companyTitle?: string;
  };
  workOrderId?: string;
  workOrder?: {
    orderNumber?: string;
    items?: InvoiceItem[];
    vehicle?: {
      plate?: string;
      brand?: string;
      model?: string;
      year?: number;
      vin?: string;
      chassisNo?: string;
      currentKm?: number;
    };
  };
  payments?: PaymentRecord[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  kdvAmount?: number;
  totalAmount?: number;
  grandTotal?: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  issueDate: string;
  dueDate?: string;
  items?: InvoiceItem[];
}

export interface CreateInvoiceInput {
  customerId: string;
  workOrderId?: string;
  dueDate?: string;
  subtotal?: number;
  kdvAmount?: number;
  grandTotal?: number;
  items?: InvoiceItem[];
  taxRate?: number;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  paymentNumber?: string;
  invoiceId?: string;
  customerId: string;
  customer?: {
    name: string;
    surname?: string;
    phone?: string;
  };
  amount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER';
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentInput {
  invoiceId?: string;
  customerId?: string;
  amount: number;
  paymentMethod?: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | string;
  method?: string;
  notes?: string;
}

export interface DailyBillingSummary {
  totalRevenue: number;
  cashTotal: number;
  creditCardTotal: number;
  bankTransferTotal: number;
  totalInvoicesIssued: number;
}

export interface CurrentAccountRecord {
  id: string;
  customerId: string;
  customer?: {
    id?: string;
    name?: string;
    surname?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    type?: string;
    companyTitle?: string;
    companyName?: string;
  };
  totalDebit?: number;
  totalCredit?: number;
  totalDebits?: number;
  totalCredits?: number;
  creditLimit?: number;
  balance: number;
  lastTransactionAt?: string;
  movements?: Array<Record<string, unknown>>;
}

export function useInvoices(status?: string) {
  return useQuery({
    queryKey: ['invoices', status],
    queryFn: () => apiClient.get<InvoiceRecord[]>('/invoices', { params: { status } }),
  });
}

export function useInvoice(id?: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => apiClient.get<InvoiceRecord>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => apiClient.post<InvoiceRecord>('/invoices', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['work-order'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['current-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Fatura başarıyla oluşturuldu.', {
        description: data?.invoiceNumber ? `${data.invoiceNumber} cari hesaba işlendi.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Fatura oluşturulamadı.';
      toast.error(message);
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
      queryClient.invalidateQueries({ queryKey: ['work-order'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['current-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.info('Fatura iptal edildi ve iş emri yeniden açıldı.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Fatura iptal edilemedi.';
      toast.error(message);
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => apiClient.get<PaymentRecord[]>('/payments'),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentInput) => apiClient.post<PaymentRecord>('/payments', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['current-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Tahsilat başarıyla kaydedildi.', {
        description: data?.amount ? `${Number(data.amount).toLocaleString('tr-TR')} ₺ hesaba işlendi.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Tahsilat kaydedilemedi.';
      toast.error(message);
    },
  });
}

export function useDailySummary() {
  return useQuery({
    queryKey: ['payments', 'daily-summary'],
    queryFn: () => apiClient.get<DailyBillingSummary>('/payments/daily-summary'),
  });
}

export function useCurrentAccounts() {
  return useQuery({
    queryKey: ['current-accounts'],
    queryFn: () => apiClient.get<CurrentAccountRecord[]>('/current-accounts'),
  });
}

export function useCustomerCurrentAccount(customerId?: string) {
  return useQuery({
    queryKey: ['current-accounts', customerId],
    queryFn: () => apiClient.get<CurrentAccountRecord>(`/current-accounts/customer/${customerId}`),
    enabled: !!customerId,
  });
}

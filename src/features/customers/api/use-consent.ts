import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export interface CustomerConsentRecord {
  id: string;
  tenantId: string;
  customerId: string;
  consentType: string;
  isGranted: boolean;
  channel: string;
  grantedAt?: string | null;
  revokedAt?: string | null;
  expiresAt?: string | null;
  policyVersion: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  verificationToken?: string | null;
  createdAt: string;
}

export interface CustomerConsentSummary {
  customerId: string;
  isKvkkApproved: boolean;
  isCommercialSmsApproved: boolean;
  latestConsentDate?: string | null;
  latestChannel?: string | null;
  history: CustomerConsentRecord[];
}

export interface SendConsentSmsResponse {
  success: boolean;
  message: string;
  verificationToken: string;
  verificationUrl: string;
  customerPhone: string;
  tenantTitle: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  alreadyGranted: boolean;
  grantedAt?: string | null;
  policyVersion: string;
  tenant: {
    id: string;
    title: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
  };
  customer: {
    id: string;
    name: string;
    phoneMasked: string;
  };
}

export interface ConfirmConsentDto {
  commercialSms: boolean;
  explicitConsent: boolean;
}

export interface DirectConsentDto {
  channel: 'IN_PERSON' | 'PAPER_FORM' | 'PHONE_CALL';
  commercialSms?: boolean;
  policyVersion?: string;
}

export function useCustomerConsents(customerId?: string) {
  return useQuery<CustomerConsentSummary>({
    queryKey: ['customer-consents', customerId],
    queryFn: () => apiClient.get<CustomerConsentSummary>(`/customers/${customerId}/consents`),
    enabled: !!customerId,
  });
}

export function useSendConsentSms() {
  const queryClient = useQueryClient();
  return useMutation<SendConsentSmsResponse, Error, { customerId: string }>({
    mutationFn: ({ customerId }) =>
      apiClient.post<SendConsentSmsResponse>(`/customers/${customerId}/send-consent-sms`),
    onSuccess: (res, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer-consents', customerId] });
      toast.success('Müşteriye KVKK onay SMS bağlantısı üretildi.', {
        description: `Doğrulama linki oluşturuldu: ${window.location.origin}${res.verificationUrl}`,
      });
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Onay SMS linki oluşturulamadı.');
    },
  });
}

export function useRecordDirectConsent() {
  const queryClient = useQueryClient();
  return useMutation<CustomerConsentRecord, Error, { customerId: string; data: DirectConsentDto }>({
    mutationFn: ({ customerId, data }) =>
      apiClient.post<CustomerConsentRecord>(`/customers/${customerId}/direct-consent`, data),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer-consents', customerId] });
      toast.success('KVKK ve İYS onayı elden/fiziksel olarak başarıyla işlendi.');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Doğrudan onay işlenirken hata oluştu.');
    },
  });
}

// Public endpoints for client verification page
export function useVerifyConsentToken(token?: string | null) {
  return useQuery<VerifyTokenResponse>({
    queryKey: ['public-consent-verify', token],
    queryFn: () => apiClient.get<VerifyTokenResponse>(`/public/consent/verify/${token}`),
    enabled: !!token,
    retry: false,
  });
}

export function useConfirmConsent() {
  return useMutation<{ success: boolean; message: string; grantedAt: string }, Error, { token: string; data: ConfirmConsentDto }>({
    mutationFn: ({ token, data }) =>
      apiClient.post(`/public/consent/confirm/${token}`, data),
  });
}

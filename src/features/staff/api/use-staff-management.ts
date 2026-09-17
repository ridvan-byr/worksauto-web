import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface StaffLeaveBalance {
  annualDays: number;
  transferredDays: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface StaffRecord {
  id: string;
  name: string;
  surname?: string | null;
  phone: string;
  email?: string | null;
  role: string;
  isActive: boolean;
  annualLeaveDays?: number;
  transferredLeaveDays?: number;
  leaveBalance?: StaffLeaveBalance;
  createdAt: string;
  mechanic?: {
    id: string;
    specialty?: string | null;
    assignedLift?: string | null;
    dailyCapacityHours?: number;
  } | null;
}

export interface CreateStaffInput {
  name: string;
  surname?: string;
  phone: string;
  email?: string;
  role: string;
  assignedLift?: string | null;
  specialty?: string;
  dailyCapacityHours?: number;
  annualLeaveDays?: number;
  transferredLeaveDays?: number;
}

export interface UpdateStaffInput {
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
  role?: string;
  assignedLift?: string | null;
  specialty?: string;
  dailyCapacityHours?: number;
  annualLeaveDays?: number;
  transferredLeaveDays?: number;
  isActive?: boolean;
}

export interface StaffLeave {
  id: string;
  tenantId: string;
  userId: string;
  leaveType: 'ANNUAL' | 'SICK' | 'COMPASSIONATE' | 'UNPAID' | 'OTHER';
  startDate: string;
  endDate: string;
  totalDays: number | string;
  reason?: string | null;
  status: 'APPROVED' | 'PENDING' | 'CANCELLED';
  approvedById?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    surname?: string | null;
    role: string;
    phone?: string | null;
  };
  approvedBy?: {
    id: string;
    name: string;
    surname?: string | null;
  };
}

export interface CreateStaffLeaveInput {
  userId: string;
  leaveType: 'ANNUAL' | 'SICK' | 'COMPASSIONATE' | 'UNPAID' | 'OTHER';
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason?: string;
}

export interface StaffAuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  userId?: string | null;
  changesBefore?: Record<string, unknown> | null;
  changesAfter?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    surname?: string | null;
    role: string;
  } | null;
}

export function useStaffList() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => apiClient.get<StaffRecord[]>('/staff'),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInput) => apiClient.post<StaffRecord>('/staff', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel başarıyla eklendi.', {
        description: data?.name ? `${data.name} ${data.surname || ''} kadroya dahil edildi.` : undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Personel eklenemedi.';
      toast.error(message);
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffInput }) =>
      apiClient.patch<StaffRecord>(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel bilgileri güncellendi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Personel güncellenemedi.';
      toast.error(message);
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel kaydı silindi / pasife alındı.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Personel silinemedi.';
      toast.error(message);
    },
  });
}

export function useStaffLeaves(userId?: string) {
  return useQuery({
    queryKey: ['staff-leaves', userId],
    queryFn: () => {
      const url = userId ? `/staff/leaves?userId=${encodeURIComponent(userId)}` : '/staff/leaves';
      return apiClient.get<StaffLeave[]>(url);
    },
  });
}

export function useCreateStaffLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffLeaveInput) => apiClient.post<StaffLeave>('/staff/leaves', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['staff-audit-logs'] });
      toast.success('İzin kaydı başarıyla oluşturuldu.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'İzin oluşturulamadı.';
      toast.error(message);
    },
  });
}

export function useCancelStaffLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leaveId: string) => apiClient.patch<StaffLeave>(`/staff/leaves/${leaveId}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['staff-audit-logs'] });
      toast.success('İzin kaydı başarıyla iptal edildi.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'İzin iptal edilemedi.';
      toast.error(message);
    },
  });
}

export function useStaffAuditLogs() {
  return useQuery({
    queryKey: ['staff-audit-logs'],
    queryFn: () => apiClient.get<StaffAuditLog[]>('/staff/audit-logs'),
  });
}

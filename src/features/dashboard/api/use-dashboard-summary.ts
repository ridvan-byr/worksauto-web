import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DashboardSummary {
  activeWorkOrdersCount: number;
  todayAppointmentsCount: number;
  criticalStockCount: number;
  unpaidInvoicesCount: number;
  unpaidTotal: number;
  todayRevenue: number;
  monthlyRevenue: number;
  recentWorkOrders: Array<{
    id: string;
    workOrderNumber: string;
    status: string;
    grandTotal: number;
    customer: { firstName: string; lastName: string; phone: string };
    vehicle: { plate: string; brand: string; model: string };
    assignedMechanic?: { user: { name: string; surname: string } };
  }>;
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
    refetchInterval: 30000, // Background refresh every 30s
  });
}

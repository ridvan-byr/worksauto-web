import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export type ReportPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "custom"

export interface FinancialReportSummary {
  totalRevenue: number
  totalLabourRevenue: number
  totalPartsRevenue: number
  totalPartsCost: number
  netProfit: number
  profitMargin: number
  cashCollected: number
  unpaidReceivables: number
  completedWorkOrdersCount: number
  averageOrderValue: number
  totalVehiclesServiced: number
}

export interface PaymentBreakdownItem {
  method: string
  label: string
  amount: number
  percentage: number
}

export interface DailyTrendItem {
  date: string
  label: string
  revenue: number
  labour: number
  parts: number
  profit: number
  orderCount: number
}

export interface WorkOrderReportRow {
  id: string
  workOrderNumber: string
  completedAt: string
  plate: string
  vehicle: string
  customerName: string
  labourTotal: number
  partsTotal: number
  partsCost: number
  grandTotal: number
  estimatedProfit: number
  profitMargin: number
  invoiceStatus?: string
}

export interface FinancialReportResponse {
  period: string
  startDate: string
  endDate: string
  summary: FinancialReportSummary
  paymentBreakdown: PaymentBreakdownItem[]
  dailyTrend: DailyTrendItem[]
  recentCompletedOrders: WorkOrderReportRow[]
}

interface UseFinancialReportOptions {
  period?: ReportPeriod
  startDate?: string
  endDate?: string
}

export function useFinancialReport(options: UseFinancialReportOptions = {}) {
  const { period = "this_month", startDate, endDate } = options

  return useQuery<FinancialReportResponse>({
    queryKey: ["financial-report", period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (period) params.append("period", period)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const qs = params.toString() ? `?${params.toString()}` : ""
      return apiClient.get<FinancialReportResponse>(`/dashboard/reports/financial${qs}`)
    },
    refetchInterval: 60000,
  })
}

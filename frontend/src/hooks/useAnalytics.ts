// Hook para dados de analytics e KPIs com React Query
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { SummaryData, AnalystPerformanceData, SLAData, VolumeData } from '@/types'

interface DateRange {
  start_date?: string
  end_date?: string
}

/**
 * Busca o resumo geral de tickets por status.
 */
export function useSummary(dateRange: DateRange = {}) {
  return useQuery({
    queryKey: ['analytics', 'summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange.start_date) params.append('start_date', dateRange.start_date)
      if (dateRange.end_date) params.append('end_date', dateRange.end_date)
      const response = await api.get<SummaryData>(`/api/analytics/summary/?${params}`)
      return response.data
    },
  })
}

/**
 * Busca dados de desempenho por analista.
 */
export function useAnalystPerformance(dateRange: DateRange = {}) {
  return useQuery({
    queryKey: ['analytics', 'by-analyst', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange.start_date) params.append('start_date', dateRange.start_date)
      if (dateRange.end_date) params.append('end_date', dateRange.end_date)
      const response = await api.get<AnalystPerformanceData>(`/api/analytics/by-analyst/?${params}`)
      return response.data
    },
  })
}

/**
 * Busca o relatório de conformidade de SLA.
 */
export function useSLAReport(dateRange: DateRange = {}) {
  return useQuery({
    queryKey: ['analytics', 'sla', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange.start_date) params.append('start_date', dateRange.start_date)
      if (dateRange.end_date) params.append('end_date', dateRange.end_date)
      const response = await api.get<SLAData>(`/api/analytics/sla/?${params}`)
      return response.data
    },
  })
}

/**
 * Busca dados de volume de tickets por período.
 */
export function useVolumeData(dateRange: DateRange = {}, agrupamento: 'dia' | 'semana' = 'dia') {
  return useQuery({
    queryKey: ['analytics', 'volume', dateRange, agrupamento],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange.start_date) params.append('start_date', dateRange.start_date)
      if (dateRange.end_date) params.append('end_date', dateRange.end_date)
      params.append('agrupamento', agrupamento)
      const response = await api.get<VolumeData>(`/api/analytics/volume/?${params}`)
      return response.data
    },
  })
}

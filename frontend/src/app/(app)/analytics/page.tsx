'use client'

// Página de analytics — somente gestor e admin
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BarChart3, CheckCircle, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { VolumeChart } from '@/components/analytics/VolumeChart'
import { AnalystPerformanceTable } from '@/components/analytics/AnalystPerformanceTable'
import { useAuth } from '@/contexts/AuthContext'
import { useAnalystPerformance, useVolumeData, useSLAReport } from '@/hooks/useAnalytics'

const agrupamentoOptions = [
  { value: 'dia', label: 'Por Dia' },
  { value: 'semana', label: 'Por Semana' },
]

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [agrupamento, setAgrupamento] = useState<'dia' | 'semana'>('dia')

  // Guarda de rota no cliente
  useEffect(() => {
    if (user && user.role === 'analista') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const dateRange = {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  }

  const { data: analystData, isLoading: analystLoading } = useAnalystPerformance(dateRange)
  const { data: volumeData, isLoading: volumeLoading } = useVolumeData(dateRange, agrupamento)
  const { data: slaData, isLoading: slaLoading } = useSLAReport(dateRange)

  if (!user || user.role === 'analista') return null

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-6">
      {/* Filtros de período */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Data Inicial"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth={false}
            className="w-40"
          />
          <Input
            label="Data Final"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth={false}
            className="w-40"
          />
          {(startDate || endDate) && (
            <Button variant="ghost" onClick={handleClearFilters} size="sm">
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Cartões de KPI de SLA */}
      {!slaLoading && slaData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total com SLA</p>
                <p className="text-2xl font-bold text-gray-900">{slaData.total_com_sla}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Conformidade Geral</p>
                <p className="text-2xl font-bold text-green-700">{slaData.conformidade_geral_pct}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">SLA Violados</p>
                <p className="text-2xl font-bold text-red-700">
                  {slaData.resolvidos_fora_sla + slaData.abertos_com_sla_vencido}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Em Risco Agora</p>
                <p className="text-2xl font-bold text-yellow-700">{slaData.abertos_sla_em_risco}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLA por prioridade */}
      {!slaLoading && slaData && slaData.por_prioridade.length > 0 && (
        <Card>
          <CardHeader title="Conformidade de SLA por Prioridade" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {slaData.por_prioridade.map((item) => {
              const color = item.compliance_pct >= 90 ? 'text-green-700 bg-green-50' :
                            item.compliance_pct >= 70 ? 'text-yellow-700 bg-yellow-50' :
                            'text-red-700 bg-red-50'
              const labelMap: Record<string, string> = { critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa' }
              return (
                <div key={item.prioridade} className={`rounded-xl p-4 ${color}`}>
                  <p className="text-sm font-semibold">{labelMap[item.prioridade] || item.prioridade}</p>
                  <p className="text-3xl font-bold mt-1">{item.compliance_pct}%</p>
                  <p className="text-xs mt-1 opacity-80">
                    {item.dentro_do_sla}/{item.total_resolvidos} resolvidos no prazo
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Gráfico de volume */}
      <Card>
        <CardHeader
          title="Volume de Tickets"
          action={
            <Select
              options={agrupamentoOptions}
              value={agrupamento}
              onChange={(e) => setAgrupamento(e.target.value as 'dia' | 'semana')}
              fullWidth={false}
              className="w-36"
            />
          }
        />
        <VolumeChart
          data={volumeData?.dados ?? []}
          agrupamento={agrupamento}
          isLoading={volumeLoading}
        />
      </Card>

      {/* Tabela de desempenho por analista */}
      <Card>
        <CardHeader
          title="Desempenho por Analista"
          subtitle="Tempo médio de resolução (TMR) e conformidade de SLA"
          action={
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <TrendingUp className="w-4 h-4" />
              {analystData?.analistas.length ?? 0} analistas
            </div>
          }
        />
        <AnalystPerformanceTable
          data={analystData?.analistas ?? []}
          isLoading={analystLoading}
        />
      </Card>
    </div>
  )
}

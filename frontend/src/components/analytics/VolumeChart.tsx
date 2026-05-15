'use client'

// Gráfico de volume de tickets com Recharts
import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { VolumeDataPoint } from '@/types'

interface VolumeChartProps {
  data: VolumeDataPoint[]
  agrupamento: 'dia' | 'semana'
  isLoading?: boolean
}

function formatPeriod(periodo: string, agrupamento: 'dia' | 'semana'): string {
  try {
    const date = parseISO(periodo)
    if (agrupamento === 'semana') {
      return `Sem. ${format(date, 'dd/MM', { locale: ptBR })}`
    }
    return format(date, 'dd/MM', { locale: ptBR })
  } catch {
    return periodo
  }
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function VolumeChart({ data, agrupamento, isLoading = false }: VolumeChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Sem dados para o período selecionado.</p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    periodo: formatPeriod(item.periodo, agrupamento),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="periodo"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-sm text-gray-600">
              {value === 'total' ? 'Total Criados' : 'Resolvidos'}
            </span>
          )}
        />
        <Bar dataKey="total" name="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="resolvidos" name="resolvidos" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

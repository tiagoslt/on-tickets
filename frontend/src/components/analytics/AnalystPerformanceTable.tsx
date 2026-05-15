// Tabela de desempenho por analista
import React from 'react'
import { clsx } from 'clsx'
import { AnalystPerformance } from '@/types'
import { TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface AnalystPerformanceTableProps {
  data: AnalystPerformance[]
  isLoading?: boolean
}

function SLABar({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={clsx('h-2 rounded-full transition-all', color)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right">{pct.toFixed(1)}%</span>
    </div>
  )
}

export function AnalystPerformanceTable({ data, isLoading = false }: AnalystPerformanceTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Nenhum dado de analista disponível para o período selecionado.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Analista</th>
            <th className="text-center pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Total</th>
            <th className="text-center pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Resolvidos</th>
            <th className="text-center pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Em Andamento</th>
            <th className="pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider min-w-[180px]">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Conformidade SLA
              </div>
            </th>
            <th className="text-right pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">
              <div className="flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5" />
                TMR
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.analista.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  {row.analista.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.analista.avatar_url}
                      alt={row.analista.nome}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-xs font-medium">
                        {row.analista.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{row.analista.nome}</p>
                    <p className="text-xs text-gray-400">{row.analista.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 text-center">
                <span className="font-semibold text-gray-900">{row.total}</span>
              </td>
              <td className="py-3 text-center">
                <span className="font-semibold text-green-700">{row.resolvidos}</span>
              </td>
              <td className="py-3 text-center">
                <span className="font-semibold text-yellow-700">{row.em_andamento}</span>
              </td>
              <td className="py-3 pr-4">
                <SLABar pct={row.sla_compliance_pct} />
              </td>
              <td className="py-3 text-right">
                <span className="font-medium text-gray-700">
                  {row.tmr_horas !== null ? `${row.tmr_horas.toFixed(1)}h` : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

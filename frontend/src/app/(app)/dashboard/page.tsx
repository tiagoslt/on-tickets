'use client'

// Dashboard com KPIs baseados no papel do usuário
import React from 'react'
import Link from 'next/link'
import { Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, Plus } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { VolumeChart } from '@/components/analytics/VolumeChart'
import { AnalystPerformanceTable } from '@/components/analytics/AnalystPerformanceTable'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useSummary, useAnalystPerformance, useVolumeData } from '@/hooks/useAnalytics'
import { useTickets } from '@/hooks/useTickets'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardPage() {
  const { user } = useAuth()
  const isGestorOrAdmin = user?.role === 'admin' || user?.role === 'gestor'

  const { data: summary, isLoading: summaryLoading } = useSummary()
  const { data: analystData, isLoading: analystLoading } = useAnalystPerformance()
  const { data: volumeData, isLoading: volumeLoading } = useVolumeData()

  // Para analistas: busca apenas seus tickets recentes
  const { data: myTickets } = useTickets({ page: 1 })

  return (
    <div className="space-y-6">
      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Abertos"
          value={summaryLoading ? '...' : (summary?.por_status.aberto ?? 0)}
          subtitle="Tickets aguardando atendimento"
          icon={Ticket}
          variant="blue"
        />
        <StatCard
          title="Em Andamento"
          value={summaryLoading ? '...' : (summary?.por_status.em_andamento ?? 0)}
          subtitle="Sendo atendidos agora"
          icon={Clock}
          variant="yellow"
        />
        <StatCard
          title="Resolvidos Hoje"
          value={summaryLoading ? '...' : (summary?.resolvidos_hoje ?? 0)}
          subtitle={`de ${summary?.por_status.resolvido ?? 0} resolvidos no total`}
          icon={CheckCircle}
          variant="green"
        />
        <StatCard
          title="SLA em Risco"
          value={summaryLoading ? '...' : (summary?.sla_em_risco ?? 0)}
          subtitle="Vence em menos de 4 horas"
          icon={AlertTriangle}
          variant="red"
        />
      </div>

      {/* Seção principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de volume */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Volume de Tickets"
              subtitle="Criados vs. resolvidos nos últimos 30 dias"
            />
            <VolumeChart
              data={volumeData?.dados ?? []}
              agrupamento="dia"
              isLoading={volumeLoading}
            />
          </Card>
        </div>

        {/* Resumo por status */}
        <div>
          <Card>
            <CardHeader title="Distribuição por Status" />
            {summaryLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : summary ? (
              <div className="space-y-3">
                {[
                  { label: 'Abertos', value: summary.por_status.aberto, color: 'bg-blue-500', pct: summary.total ? Math.round(summary.por_status.aberto / summary.total * 100) : 0 },
                  { label: 'Em Andamento', value: summary.por_status.em_andamento, color: 'bg-yellow-500', pct: summary.total ? Math.round(summary.por_status.em_andamento / summary.total * 100) : 0 },
                  { label: 'Aguardando Cliente', value: summary.por_status.aguardando_cliente, color: 'bg-cyan-500', pct: summary.total ? Math.round(summary.por_status.aguardando_cliente / summary.total * 100) : 0 },
                  { label: 'Resolvidos', value: summary.por_status.resolvido, color: 'bg-green-500', pct: summary.total ? Math.round(summary.por_status.resolvido / summary.total * 100) : 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${item.color}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="font-semibold text-gray-900">{summary.total}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Desempenho por analista (somente gestor/admin) */}
      {isGestorOrAdmin && (
        <Card>
          <CardHeader
            title="Desempenho por Analista"
            subtitle="TMR e conformidade de SLA"
            action={
              <Link href="/analytics">
                <Button variant="ghost" size="sm" rightIcon={<TrendingUp className="w-4 h-4" />}>
                  Ver Analytics
                </Button>
              </Link>
            }
          />
          <AnalystPerformanceTable
            data={analystData?.analistas ?? []}
            isLoading={analystLoading}
          />
        </Card>
      )}

      {/* Tickets recentes */}
      <Card>
        <CardHeader
          title={isGestorOrAdmin ? 'Tickets Recentes' : 'Meus Tickets Recentes'}
          action={
            <Link href="/tickets/new">
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Novo Ticket
              </Button>
            </Link>
          }
        />
        {myTickets?.results && myTickets.results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase">Nº Ticket</th>
                  <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase">Prioridade</th>
                  <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase">Criado em</th>
                  <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myTickets.results.slice(0, 8).map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`} legacyBehavior>
                    <tr className="hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="py-3 text-gray-500 font-mono">{ticket.ticket_number}</td>
                      <td className="py-3 font-medium text-gray-900">{ticket.client?.name ?? '—'}</td>
                      <td className="py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="py-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="py-3 text-gray-500">
                        {format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3">
                        {ticket.assigned_to ? (
                          <div
                            className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center"
                            title={ticket.assigned_to.full_name}
                          >
                            <span className="text-white text-xs font-semibold">
                              {ticket.assigned_to.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs italic">—</span>
                        )}
                      </td>
                    </tr>
                  </Link>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Ticket className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhum ticket encontrado.</p>
            <Link href="/tickets/new" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
              Criar o primeiro ticket
            </Link>
          </div>
        )}
        {myTickets && myTickets.count > 8 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/tickets" className="text-sm text-blue-600 hover:underline">
              Ver todos os {myTickets.count} tickets
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}

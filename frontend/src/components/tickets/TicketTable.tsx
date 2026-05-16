'use client'

// Tabela de tickets com filtros e paginação
import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Inbox } from 'lucide-react'
import { Ticket, TicketFilters, TicketStatus, TicketPriority } from '@/types'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { SLAIndicator } from './SLAIndicator'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

interface TicketTableProps {
  tickets: Ticket[]
  isLoading: boolean
  filters: TicketFilters
  onFiltersChange: (filters: TicketFilters) => void
  totalCount?: number
  currentPage?: number
  onPageChange?: (page: number) => void
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'aberto', label: 'A Distribuir' },
  { value: 'em_andamento', label: 'Em Atendimento' },
  { value: 'aguardando_cliente', label: 'Aguardando Cliente' },
  { value: 'resolvido', label: 'Concluído' },
]

const priorityOptions = [
  { value: '', label: 'Todas as prioridades' },
  { value: 'critica', label: 'Crítica' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]

export function TicketTable({
  tickets,
  isLoading,
  filters,
  onFiltersChange,
  totalCount = 0,
  currentPage = 1,
  onPageChange,
}: TicketTableProps) {
  const { user } = useAuth()
  const pageSize = 20
  const totalPages = Math.ceil(totalCount / pageSize)

  const handleFilterChange = (key: keyof TicketFilters, value: string | number) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 })
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar por título ou descrição..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            fullWidth
          />
        </div>
        <div className="w-44">
          <Select
            options={statusOptions}
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value as TicketStatus | '')}
          />
        </div>
        <div className="w-44">
          <Select
            options={priorityOptions}
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value as TicketPriority | '')}
          />
        </div>
        <div className="w-40">
          <Input
            type="date"
            placeholder="Data inicial"
            value={filters.start_date || ''}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            fullWidth
          />
        </div>
        <div className="w-40">
          <Input
            type="date"
            placeholder="Data final"
            value={filters.end_date || ''}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            fullWidth
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Carregando tickets...</span>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Inbox className="w-12 h-12 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Nenhum ticket encontrado</p>
              <p className="text-xs text-gray-500 mt-1">Tente ajustar os filtros ou crie um novo ticket.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nº Ticket</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prioridade</th>
                  {user?.role !== 'analista' && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analista</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Distribuído em</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono whitespace-nowrap">{ticket.ticket_number}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                      >
                        {ticket.title}
                      </Link>
                      {ticket.client && (
                        <span className="text-xs text-gray-400 block">{ticket.client.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    {user?.role !== 'analista' && (
                      <td className="px-4 py-3 text-gray-600">
                        {ticket.assigned_to ? ticket.assigned_to.full_name : (
                          <span className="text-gray-400 italic">Não atribuído</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <SLAIndicator ticket={ticket} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/tickets/${ticket.id}`}>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalCount)}–{Math.min(currentPage * pageSize, totalCount)} de {totalCount} tickets
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange?.(currentPage - 1)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange?.(currentPage + 1)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

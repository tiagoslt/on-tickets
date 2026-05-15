'use client'

// Página de listagem de tickets com filtros
import React, { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TicketTable } from '@/components/tickets/TicketTable'
import { Button } from '@/components/ui/Button'
import { useTickets } from '@/hooks/useTickets'
import { TicketFilters } from '@/types'

export default function TicketsPage() {
  const [filters, setFilters] = useState<TicketFilters>({ page: 1 })
  const { data, isLoading } = useTickets(filters)

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Todos os Tickets</h2>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.count} {data.count === 1 ? 'ticket encontrado' : 'tickets encontrados'}
            </p>
          )}
        </div>
        <Link href="/tickets/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Novo Ticket</Button>
        </Link>
      </div>

      {/* Tabela com filtros */}
      <TicketTable
        tickets={data?.results ?? []}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={data?.count ?? 0}
        currentPage={filters.page ?? 1}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />
    </div>
  )
}

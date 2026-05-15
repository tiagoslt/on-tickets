'use client'

// Página de criação de novo ticket
import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TicketForm } from '@/components/tickets/TicketForm'
import { Card } from '@/components/ui/Card'
import { useCreateTicket } from '@/hooks/useTickets'
import { TicketCreateInput } from '@/types'

export default function NewTicketPage() {
  const router = useRouter()
  const createTicket = useCreateTicket()

  const handleSubmit = async (data: TicketCreateInput) => {
    try {
      const ticket = await createTicket.mutateAsync(data)
      router.push(`/tickets/${ticket.id}`)
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, string[]> } }
      const errorData = err.response?.data
      if (errorData) {
        const messages = Object.values(errorData).flat().join('\n')
        alert(`Erro ao criar ticket:\n${messages}`)
      } else {
        alert('Erro ao criar ticket. Tente novamente.')
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Navegação */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Tickets
      </Link>

      {/* Formulário */}
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Criar Novo Ticket</h2>
          <p className="text-sm text-gray-500 mt-1">
            Preencha as informações abaixo para abrir um novo chamado.
          </p>
        </div>
        <TicketForm
          onSubmit={handleSubmit}
          isSubmitting={createTicket.isPending}
          submitLabel="Criar Ticket"
        />
      </Card>
    </div>
  )
}

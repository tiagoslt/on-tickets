'use client'

// Página de detalhes do ticket com comentários, histórico e ações
import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  User,
  Calendar,
  Tag,
  Clock,
  MessageSquare,
  History,
  Send,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Hash,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { SLAIndicator } from '@/components/tickets/SLAIndicator'
import { useTicket, useChangeTicketStatus, useAssignTicket, useAddComment } from '@/hooks/useTickets'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { User as UserType, TicketStatus } from '@/types'

const statusOptions = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando_cliente', label: 'Aguardando Cliente' },
  { value: 'resolvido', label: 'Resolvido' },
]

const fieldLabels: Record<string, string> = {
  status: 'Status',
  priority: 'Prioridade',
  assigned_to: 'Responsável',
  title: 'Título',
  description: 'Descrição',
  client: 'Cliente',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = Number(params.id)
  const { user } = useAuth()

  const { data: ticket, isLoading, error } = useTicket(ticketId)
  const changeStatus = useChangeTicketStatus(ticketId)
  const assignTicket = useAssignTicket(ticketId)
  const addComment = useAddComment(ticketId)

  const [commentText, setCommentText] = useState('')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<TicketStatus>('aberto')
  const [statusComment, setStatusComment] = useState('')
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>('')

  // Busca analistas para atribuição
  const { data: analysts } = useQuery({
    queryKey: ['users', 'analistas'],
    queryFn: async () => {
      const response = await api.get<{ results: UserType[] }>('/api/auth/users/?role=analista')
      return response.data.results || []
    },
    enabled: user?.role === 'admin' || user?.role === 'gestor',
  })

  const canManage = user?.role === 'admin' || user?.role === 'gestor'
  const canChangeStatus = canManage || (user?.role === 'analista' && (
    ticket?.assigned_to?.id === user?.id || ticket?.created_by?.id === user?.id
  ))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Ticket não encontrado ou sem permissão de acesso.</p>
        <Link href="/tickets" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
          Voltar para Tickets
        </Link>
      </div>
    )
  }

  const handleStatusChange = async () => {
    try {
      await changeStatus.mutateAsync({ status: newStatus, comment: statusComment })
      setIsStatusModalOpen(false)
      setStatusComment('')
    } catch {
      alert('Erro ao mudar status. Tente novamente.')
    }
  }

  const handleAssign = async () => {
    if (!selectedAnalystId) return
    try {
      await assignTicket.mutateAsync(Number(selectedAnalystId))
      setIsAssignModalOpen(false)
    } catch {
      alert('Erro ao atribuir ticket. Tente novamente.')
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      await addComment.mutateAsync(commentText)
      setCommentText('')
    } catch {
      alert('Erro ao adicionar comentário. Tente novamente.')
    }
  }

  const analystOptions = [
    { value: '', label: 'Selecione um analista' },
    ...(analysts?.map((a) => ({ value: String(a.id), label: a.full_name })) || []),
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navegação */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Tickets
      </Link>

      {/* Cabeçalho do ticket */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 text-gray-400 font-mono text-sm">
                <Hash className="w-3.5 h-3.5" />{ticket.ticket_number}
              </span>
              <StatusBadge status={ticket.status} size="md" />
              <PriorityBadge priority={ticket.priority} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Criado por {ticket.created_by.full_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(ticket.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              {ticket.client && (
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {ticket.client.name}
                </span>
              )}
              {ticket.ticket_link && (
                <a
                  href={ticket.ticket_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver ticket original
                </a>
              )}
              <SLAIndicator ticket={ticket} />
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {canChangeStatus && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={() => {
                  setNewStatus(ticket.status)
                  setIsStatusModalOpen(true)
                }}
              >
                Mudar Status
              </Button>
            )}
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<UserCheck className="w-4 h-4" />}
                onClick={() => {
                  setSelectedAnalystId(ticket.assigned_to ? String(ticket.assigned_to.id) : '')
                  setIsAssignModalOpen(true)
                }}
              >
                Atribuir
              </Button>
            )}
          </div>
        </div>

        {/* Responsável */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Responsável:</span>
            {ticket.assigned_to ? (
              <div className="flex items-center gap-2">
                {ticket.assigned_to.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ticket.assigned_to.avatar_url} alt={ticket.assigned_to.full_name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 text-xs">{ticket.assigned_to.full_name.charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">{ticket.assigned_to.full_name}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">Não atribuído</span>
            )}
          </div>
        </div>
      </Card>

      {/* Descrição */}
      <Card>
        <CardHeader title="Descrição" />
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {ticket.description}
        </div>
        {ticket.resolved_at && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-green-700">
            <Clock className="w-4 h-4" />
            <span>
              Resolvido em {format(new Date(ticket.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        )}
      </Card>

      {/* Comentários */}
      <Card>
        <CardHeader
          title="Comentários"
          subtitle={`${ticket.comments?.length ?? 0} comentário(s)`}
          action={<MessageSquare className="w-5 h-5 text-gray-400" />}
        />

        {/* Lista de comentários */}
        <div className="space-y-4 mb-6">
          {ticket.comments && ticket.comments.length > 0 ? (
            ticket.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  {comment.author.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={comment.author.avatar_url} alt={comment.author.full_name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-medium">{comment.author.full_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.author.full_name}</span>
                      <Badge variant="gray" size="sm">{comment.author.role}</Badge>
                      <span className="text-xs text-gray-400">
                        {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 italic">Nenhum comentário ainda.</p>
          )}
        </div>

        {/* Formulário de novo comentário */}
        <form onSubmit={handleAddComment} className="flex gap-3">
          <div className="flex-shrink-0">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs">{user?.full_name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Adicione um comentário..."
              rows={2}
              className="flex-1 block rounded-xl border border-gray-300 text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <Button
              type="submit"
              size="sm"
              isLoading={addComment.isPending}
              disabled={!commentText.trim()}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar
            </Button>
          </div>
        </form>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader
          title="Histórico de Alterações"
          action={<History className="w-5 h-5 text-gray-400" />}
        />
        {ticket.history && ticket.history.length > 0 ? (
          <div className="space-y-3">
            {ticket.history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    {entry.changed_by.full_name}
                  </span>
                  <span className="text-gray-500"> alterou </span>
                  <span className="font-medium text-gray-700">
                    {fieldLabels[entry.field_changed] || entry.field_changed}
                  </span>
                  {entry.old_value && (
                    <>
                      <span className="text-gray-500"> de </span>
                      <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-xs">{entry.old_value}</span>
                    </>
                  )}
                  {entry.new_value && (
                    <>
                      <span className="text-gray-500"> para </span>
                      <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs">{entry.new_value}</span>
                    </>
                  )}
                  <span className="text-gray-400 ml-2 text-xs">
                    {format(new Date(entry.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Nenhuma alteração registrada.</p>
        )}
      </Card>

      {/* Modal de mudança de status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Mudar Status do Ticket"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleStatusChange}
              isLoading={changeStatus.isPending}
              disabled={newStatus === ticket.status}
            >
              Confirmar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Novo Status"
            options={statusOptions}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Comentário (opcional)</label>
            <textarea
              rows={3}
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder="Descreva o motivo da mudança de status..."
              className="block w-full rounded-lg border border-gray-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal de atribuição */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Atribuir Ticket"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleAssign}
              isLoading={assignTicket.isPending}
              disabled={!selectedAnalystId}
            >
              Atribuir
            </Button>
          </div>
        }
      >
        <Select
          label="Selecionar Analista"
          options={analystOptions}
          value={selectedAnalystId}
          onChange={(e) => setSelectedAnalystId(e.target.value)}
        />
        {ticket.assigned_to && (
          <p className="text-sm text-gray-500 mt-3">
            Atualmente atribuído para: <strong>{ticket.assigned_to.full_name}</strong>
          </p>
        )}
      </Modal>
    </div>
  )
}

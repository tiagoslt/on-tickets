// Hook para gerenciamento de dados de tickets com React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  Ticket,
  TicketCreateInput,
  TicketUpdateInput,
  TicketFilters,
  PaginatedResponse,
} from '@/types'

// Chaves de cache do React Query
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: number) => [...ticketKeys.details(), id] as const,
}

/**
 * Busca lista de tickets com filtros opcionais.
 */
export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.analyst_id) params.append('analyst_id', String(filters.analyst_id))
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', String(filters.page))

      const response = await api.get<PaginatedResponse<Ticket>>(`/api/tickets/?${params}`)
      return response.data
    },
  })
}

/**
 * Busca detalhes de um ticket específico.
 */
export function useTicket(id: number) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Ticket>(`/api/tickets/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Mutation para criar um novo ticket.
 */
export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TicketCreateInput) => {
      const response = await api.post<Ticket>('/api/tickets/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

/**
 * Mutation para atualizar um ticket existente.
 */
export function useUpdateTicket(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TicketUpdateInput) => {
      const response = await api.patch<Ticket>(`/api/tickets/${id}/`, data)
      return response.data
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(ticketKeys.detail(id), updatedTicket)
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

/**
 * Mutation para deletar um ticket.
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/tickets/${id}/`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

/**
 * Mutation para atribuir ticket a um analista.
 */
export function useAssignTicket(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (analystId: number) => {
      const response = await api.post<Ticket>(`/api/tickets/${ticketId}/assign/`, {
        analyst_id: analystId,
      })
      return response.data
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(ticketKeys.detail(ticketId), updatedTicket)
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

/**
 * Mutation para mudar o status de um ticket.
 */
export function useChangeTicketStatus(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ status, comment }: { status: string; comment?: string }) => {
      const response = await api.post<Ticket>(`/api/tickets/${ticketId}/status/`, {
        status,
        comment,
      })
      return response.data
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(ticketKeys.detail(ticketId), updatedTicket)
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

/**
 * Mutation para adicionar um comentário ao ticket.
 */
export function useAddComment(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/api/tickets/${ticketId}/comments/`, { content })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) })
    },
  })
}

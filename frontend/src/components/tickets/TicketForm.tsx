'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { User, Client, TicketCreateInput } from '@/types'

const ticketSchema = z.object({
  ticket_number: z.string().min(1, 'Número do ticket é obrigatório'),
  client_id: z.number({ invalid_type_error: 'Cliente é obrigatório' }).min(1, 'Cliente é obrigatório'),
  description: z.string().optional(),
  ticket_link: z.string().url('URL inválida').optional().or(z.literal('')),
  priority: z.enum(['baixa', 'media', 'alta', 'critica'], {
    errorMap: () => ({ message: 'Selecione uma prioridade válida' }),
  }),
  assigned_to_id: z.number().nullable().optional(),
})

type TicketFormData = z.infer<typeof ticketSchema>

interface TicketFormProps {
  defaultValues?: Partial<TicketFormData>
  onSubmit: (data: TicketCreateInput) => void
  isSubmitting?: boolean
  submitLabel?: string
}

const priorityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
]

export function TicketForm({ defaultValues, onSubmit, isSubmitting = false, submitLabel = 'Criar Ticket' }: TicketFormProps) {
  const { user } = useAuth()
  const canAssign = user?.role === 'admin' || user?.role === 'gestor'

  const { register, handleSubmit, control, formState: { errors } } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { priority: 'media', ...defaultValues },
  })

  const { data: analysts } = useQuery({
    queryKey: ['users', 'analistas'],
    queryFn: async () => {
      const res = await api.get<{ results: User[] }>('/api/auth/users/?role=analista')
      return res.data.results || []
    },
    enabled: canAssign,
  })

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get<Client[]>('/api/clients/')
      return Array.isArray(res.data) ? res.data : (res.data as { results?: Client[] }).results || []
    },
  })

  const analystOptions = [
    { value: '', label: 'Não atribuído' },
    ...(analysts?.map((a) => ({ value: String(a.id), label: a.full_name })) || []),
  ]

  const clientOptions = [
    { value: '', label: 'Selecione um cliente *' },
    ...(clients?.map((c) => ({ value: String(c.id), label: c.name })) || []),
  ]

  const handleFormSubmit = (data: TicketFormData) => {
    onSubmit({
      ticket_number: data.ticket_number,
      title: '',
      description: data.description || '',
      ticket_link: data.ticket_link || '',
      priority: data.priority,
      client_id: data.client_id,
      assigned_to_id: data.assigned_to_id || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Número do ticket e Cliente */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Número do Ticket"
          placeholder="Ex: TKT-00123"
          required
          error={errors.ticket_number?.message}
          {...register('ticket_number')}
        />
        <Controller
          name="client_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Cliente"
              required
              options={clientOptions}
              value={field.value ? String(field.value) : ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              error={errors.client_id?.message}
            />
          )}
        />
      </div>

      {/* Descrição */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          rows={4}
          placeholder="Detalhes adicionais sobre o ticket (opcional)..."
          className="block w-full rounded-lg border border-gray-300 bg-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          {...register('description')}
        />
      </div>

      {/* Link do ticket */}
      <Input
        label="Link do Ticket"
        placeholder="https://sistema.exemplo.com/ticket/123"
        error={errors.ticket_link?.message}
        {...register('ticket_link')}
      />

      {/* Prioridade */}
      <Controller
        name="priority"
        control={control}
        render={({ field }) => (
          <Select
            label="Prioridade"
            required
            options={priorityOptions}
            error={errors.priority?.message}
            {...field}
          />
        )}
      />

      {/* Atribuição (somente gestor/admin) */}
      {canAssign && (
        <Controller
          name="assigned_to_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Atribuir para"
              options={analystOptions}
              value={field.value ? String(field.value) : ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
            />
          )}
        />
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isSubmitting} size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

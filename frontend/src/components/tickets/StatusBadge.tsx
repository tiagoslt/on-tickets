// Badge de status do ticket com cores semânticas
import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { TicketStatus } from '@/types'

interface StatusBadgeProps {
  status: TicketStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<TicketStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray' }> = {
  aberto: { label: 'A Distribuir', variant: 'primary' },
  em_andamento: { label: 'Em Atendimento', variant: 'warning' },
  aguardando_cliente: { label: 'Aguardando Cliente', variant: 'info' },
  resolvido: { label: 'Concluído', variant: 'success' },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' as const }
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  )
}

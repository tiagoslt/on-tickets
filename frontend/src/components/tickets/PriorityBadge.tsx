// Badge de prioridade do ticket com cores semânticas
import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { TicketPriority } from '@/types'

interface PriorityBadgeProps {
  priority: TicketPriority
  size?: 'sm' | 'md'
}

const priorityConfig: Record<TicketPriority, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray' }> = {
  baixa: { label: 'Baixa', variant: 'gray' },
  media: { label: 'Média', variant: 'primary' },
  alta: { label: 'Alta', variant: 'warning' },
  critica: { label: 'Crítica', variant: 'danger' },
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || { label: priority, variant: 'default' as const }
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  )
}

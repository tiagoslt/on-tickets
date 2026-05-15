// Indicador visual de SLA (verde/amarelo/vermelho)
import React from 'react'
import { clsx } from 'clsx'
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Ticket } from '@/types'

interface SLAIndicatorProps {
  ticket: Ticket
  showLabel?: boolean
}

type SLAState = 'ok' | 'warning' | 'breached' | 'resolved_ok' | 'resolved_breached' | 'no_sla'

function getSLAState(ticket: Ticket): SLAState {
  if (!ticket.sla_deadline) return 'no_sla'

  if (ticket.status === 'resolvido') {
    return ticket.sla_breached ? 'resolved_breached' : 'resolved_ok'
  }

  if (ticket.sla_breached) return 'breached'

  // Aviso: menos de 20% do tempo restante ou menos de 4 horas
  const remaining = ticket.sla_remaining_hours
  if (remaining !== null && remaining <= 4) return 'warning'

  return 'ok'
}

const stateConfig: Record<SLAState, {
  label: string
  icon: React.ElementType
  className: string
  dotClass: string
}> = {
  ok: {
    label: 'Dentro do SLA',
    icon: CheckCircle,
    className: 'text-green-700 bg-green-50',
    dotClass: 'bg-green-500',
  },
  warning: {
    label: 'SLA em risco',
    icon: AlertTriangle,
    className: 'text-yellow-700 bg-yellow-50',
    dotClass: 'bg-yellow-500',
  },
  breached: {
    label: 'SLA violado',
    icon: XCircle,
    className: 'text-red-700 bg-red-50',
    dotClass: 'bg-red-500',
  },
  resolved_ok: {
    label: 'Resolvido no prazo',
    icon: CheckCircle,
    className: 'text-green-700 bg-green-50',
    dotClass: 'bg-green-500',
  },
  resolved_breached: {
    label: 'Resolvido fora do prazo',
    icon: XCircle,
    className: 'text-red-700 bg-red-50',
    dotClass: 'bg-red-500',
  },
  no_sla: {
    label: 'Sem SLA',
    icon: Clock,
    className: 'text-gray-500 bg-gray-50',
    dotClass: 'bg-gray-400',
  },
}

function formatRemainingTime(hours: number | null): string {
  if (hours === null) return ''
  if (hours < 0) {
    const abs = Math.abs(hours)
    if (abs < 1) return `${Math.round(abs * 60)}min atrasado`
    if (abs < 24) return `${Math.round(abs)}h atrasado`
    return `${Math.round(abs / 24)}d atrasado`
  }
  if (hours < 1) return `${Math.round(hours * 60)}min restantes`
  if (hours < 24) return `${Math.round(hours)}h restantes`
  return `${Math.round(hours / 24)}d restantes`
}

export function SLAIndicator({ ticket, showLabel = true }: SLAIndicatorProps) {
  const state = getSLAState(ticket)
  const config = stateConfig[state]
  const Icon = config.icon

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        config.className
      )}
      title={ticket.sla_deadline ? `Prazo: ${new Date(ticket.sla_deadline).toLocaleString('pt-BR')}` : 'Sem prazo de SLA'}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {showLabel && (
        <span>
          {ticket.status !== 'resolvido' && ticket.sla_remaining_hours !== null
            ? formatRemainingTime(ticket.sla_remaining_hours)
            : config.label}
        </span>
      )}
    </div>
  )
}

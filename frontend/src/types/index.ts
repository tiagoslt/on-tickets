// Tipos TypeScript para o sistema OPA de tickets

// ============================================================
// Tipos de Usuário
// ============================================================

export type Role = 'admin' | 'gestor' | 'analista'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: Role
  avatar_url: string
  date_joined: string
  is_active: boolean
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface AuthResponse {
  tokens: AuthTokens
  usuario: User
}

// ============================================================
// Tipos de Ticket
// ============================================================

export type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'resolvido'
export type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica'

export interface TicketUser {
  id: number
  email: string
  full_name: string
  role: Role
  avatar_url: string
}

export interface TicketComment {
  id: number
  content: string
  author: TicketUser
  created_at: string
}

export interface TicketHistoryEntry {
  id: number
  field_changed: string
  old_value: string
  new_value: string
  changed_by: TicketUser
  changed_at: string
}

export interface Client {
  id: number
  name: string
  is_active: boolean
  created_at: string
}

export interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string
  ticket_link: string
  status: TicketStatus
  status_display: string
  priority: TicketPriority
  priority_display: string
  assigned_to: TicketUser | null
  created_by: TicketUser
  client: Client | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  sla_deadline: string | null
  sla_breached: boolean
  sla_remaining_hours: number | null
  comments?: TicketComment[]
  history?: TicketHistoryEntry[]
}

export interface TicketCreateInput {
  ticket_number: string
  title?: string
  description?: string
  ticket_link?: string
  priority: TicketPriority
  client_id: number
  assigned_to_id?: number | null
}

export interface TicketUpdateInput {
  title?: string
  description?: string
  ticket_link?: string
  priority?: TicketPriority
  client_id?: number | null
  assigned_to_id?: number | null
}

export interface TicketFilters {
  status?: TicketStatus | ''
  priority?: TicketPriority | ''
  analyst_id?: number | ''
  client_id?: number | ''
  start_date?: string
  end_date?: string
  search?: string
  page?: number
}

// ============================================================
// Tipos de Analytics
// ============================================================

export interface SummaryData {
  total: number
  por_status: {
    aberto: number
    em_andamento: number
    aguardando_cliente: number
    resolvido: number
  }
  resolvidos_hoje: number
  sla_em_risco: number
  periodo: {
    inicio: string | null
    fim: string | null
  }
}

export interface AnalystPerformance {
  analista: {
    id: number
    nome: string
    email: string
    avatar_url: string
  }
  total: number
  resolvidos: number
  abertos: number
  em_andamento: number
  sla_compliance_pct: number
  tmr_horas: number | null
}

export interface AnalystPerformanceData {
  analistas: AnalystPerformance[]
  periodo: {
    inicio: string | null
    fim: string | null
  }
}

export interface SLAPriorityData {
  prioridade: string
  total_resolvidos: number
  dentro_do_sla: number
  compliance_pct: number
}

export interface SLAData {
  total_com_sla: number
  resolvidos_no_sla: number
  resolvidos_fora_sla: number
  abertos_com_sla_vencido: number
  abertos_sla_em_risco: number
  conformidade_geral_pct: number
  por_prioridade: SLAPriorityData[]
  periodo: {
    inicio: string | null
    fim: string | null
  }
}

export interface VolumeDataPoint {
  periodo: string
  total: number
  resolvidos: number
}

export interface VolumeData {
  agrupamento: 'dia' | 'semana'
  dados: VolumeDataPoint[]
  periodo: {
    inicio: string | null
    fim: string | null
  }
}

// ============================================================
// Tipos de Paginação
// ============================================================

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ============================================================
// Tipos de Formulário
// ============================================================

export interface DateRangeFilter {
  start_date: string
  end_date: string
}

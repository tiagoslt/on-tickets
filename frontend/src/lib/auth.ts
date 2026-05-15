// Utilitários de autenticação para o sistema OPA
import { User, AuthTokens } from '@/types'

// Chaves do localStorage
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

/**
 * Salva os tokens JWT e os dados do usuário no localStorage.
 */
export function saveAuthData(tokens: AuthTokens, user: User): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Remove todos os dados de autenticação do localStorage.
 */
export function clearAuthData(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Retorna o token de acesso armazenado.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

/**
 * Retorna o token de refresh armazenado.
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * Retorna o usuário autenticado do localStorage.
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data) as User
  } catch {
    return null
  }
}

/**
 * Verifica se há uma sessão ativa (token presente).
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

/**
 * Formata o nome de exibição do papel do usuário em português.
 */
export function formatRole(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    analista: 'Analista',
  }
  return labels[role] || role
}

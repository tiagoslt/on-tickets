'use client'

// Contexto de autenticação global da aplicação OPA
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@/types'
import { getStoredUser, clearAuthData, isAuthenticated } from '@/lib/auth'
import api from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isLoggedIn: boolean
  login: (user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carrega o usuário do localStorage ao montar o contexto
  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser && isAuthenticated()) {
      setUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  /**
   * Define o usuário autenticado no estado.
   */
  const login = useCallback((userData: User) => {
    setUser(userData)
  }, [])

  /**
   * Remove dados de autenticação e redireciona para login.
   */
  const logout = useCallback(async () => {
    clearAuthData()
    await fetch('/api/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/login'
  }, [])

  /**
   * Recarrega os dados do usuário autenticado a partir da API.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me/')
      const updatedUser = response.data as User
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch {
      // Se não conseguir atualizar, mantém o usuário atual
    }
  }, [])

  const isLoggedIn = !!user && isAuthenticated()

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggedIn, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para acessar o contexto de autenticação.
 * Lança erro se usado fora do AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

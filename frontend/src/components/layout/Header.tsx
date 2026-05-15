'use client'

// Cabeçalho superior da aplicação
import React from 'react'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Mapeamento de rotas para títulos de página
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tickets': 'Tickets',
  '/tickets/new': 'Novo Ticket',
  '/analytics': 'Analytics',
  '/admin/users': 'Gestão de Usuários',
}

function getPageTitle(pathname: string): string {
  // Verifica título exato primeiro
  if (pageTitles[pathname]) return pageTitles[pathname]

  // Verifica padrão de detalhe de ticket
  if (pathname.match(/^\/tickets\/\d+$/)) return 'Detalhes do Ticket'

  return 'On-Tickets'
}

export function Header() {
  const pathname = usePathname()
  const { user } = useAuth()
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Título da página */}
      <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>

      {/* Ações do cabeçalho */}
      <div className="flex items-center gap-3">
        {/* Notificações (placeholder visual) */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar compacto */}
        {user && (
          <div className="flex items-center gap-2">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-700 font-medium hidden sm:block">
              {user.full_name}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}

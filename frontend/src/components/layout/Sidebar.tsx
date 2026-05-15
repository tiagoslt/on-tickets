'use client'

// Sidebar de navegação com menu baseado em papel do usuário
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Users,
  LogOut,
  PlusCircle,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatRole } from '@/lib/auth'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles?: string[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: '/tickets',
    label: 'Tickets',
    icon: <Ticket className="w-5 h-5" />,
  },
  {
    href: '/tickets/new',
    label: 'Novo Ticket',
    icon: <PlusCircle className="w-5 h-5" />,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['admin', 'gestor'],
  },
  {
    href: '/admin/users',
    label: 'Usuários',
    icon: <Users className="w-5 h-5" />,
    roles: ['admin'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  // Filtra itens de menu conforme o papel do usuário
  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  )

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Ticket className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg">On-Tickets</span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Perfil do usuário */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
            <p className="text-xs text-gray-400">{formatRole(user.role)}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}

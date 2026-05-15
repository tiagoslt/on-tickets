// Cartão de estatística para o dashboard
import React from 'react'
import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'

type StatVariant = 'blue' | 'yellow' | 'green' | 'red' | 'gray'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  variant?: StatVariant
  trend?: {
    value: number
    label: string
  }
}

const variantConfig: Record<StatVariant, {
  bg: string
  iconBg: string
  iconColor: string
  valueColor: string
}> = {
  blue: {
    bg: 'bg-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-700',
  },
  yellow: {
    bg: 'bg-white',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    valueColor: 'text-yellow-700',
  },
  green: {
    bg: 'bg-white',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    valueColor: 'text-green-700',
  },
  red: {
    bg: 'bg-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    valueColor: 'text-red-700',
  },
  gray: {
    bg: 'bg-white',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    valueColor: 'text-gray-700',
  },
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'blue', trend }: StatCardProps) {
  const config = variantConfig[variant]

  return (
    <div className={clsx('rounded-xl border border-gray-200 shadow-sm p-6', config.bg)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={clsx('text-3xl font-bold mt-1', config.valueColor)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={clsx(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl flex-shrink-0', config.iconBg)}>
          <Icon className={clsx('w-6 h-6', config.iconColor)} />
        </div>
      </div>
    </div>
  )
}

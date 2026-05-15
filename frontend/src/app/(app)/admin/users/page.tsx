'use client'

// Página de gestão de usuários — somente admin
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, Shield, UserCheck, Edit2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { User, Role } from '@/types'
import { formatRole } from '@/lib/auth'

const roleOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'analista', label: 'Analista' },
]

const roleVariants: Record<Role, 'danger' | 'warning' | 'primary'> = {
  admin: 'danger',
  gestor: 'warning',
  analista: 'primary',
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<Role>('analista')
  const [editActive, setEditActive] = useState(true)

  // Guarda de rota
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get<{ results: User[]; count: number }>('/api/auth/users/')
      return response.data
    },
    enabled: user?.role === 'admin',
  })

  const updateUser = useMutation({
    mutationFn: async ({ id, role, is_active }: { id: number; role: Role; is_active: boolean }) => {
      const response = await api.patch<User>(`/api/auth/users/${id}/`, { role, is_active })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
  })

  if (!user || user.role !== 'admin') return null

  const handleEditClick = (u: User) => {
    setEditingUser(u)
    setEditRole(u.role)
    setEditActive(u.is_active)
  }

  const handleSave = async () => {
    if (!editingUser) return
    await updateUser.mutateAsync({
      id: editingUser.id,
      role: editRole,
      is_active: editActive,
    })
  }

  const users = usersData?.results ?? []
  const totalByRole = {
    admin: users.filter((u) => u.role === 'admin').length,
    gestor: users.filter((u) => u.role === 'gestor').length,
    analista: users.filter((u) => u.role === 'analista').length,
  }

  return (
    <div className="space-y-6">
      {/* Resumo por perfil */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { role: 'admin', label: 'Administradores', icon: Shield, variant: 'danger' as const },
          { role: 'gestor', label: 'Gestores', icon: UserCheck, variant: 'warning' as const },
          { role: 'analista', label: 'Analistas', icon: Users, variant: 'primary' as const },
        ] as const).map((item) => {
          const Icon = item.icon
          return (
            <div key={item.role} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{totalByRole[item.role]}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabela de usuários */}
      <Card>
        <CardHeader
          title="Todos os Usuários"
          subtitle={`${usersData?.count ?? 0} usuários cadastrados`}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Usuário</th>
                  <th className="text-left pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">E-mail</th>
                  <th className="text-left pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Perfil</th>
                  <th className="text-left pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                  <th className="text-left pb-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Membro desde</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt={u.full_name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 text-sm font-medium">{u.full_name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{u.full_name}</p>
                          {u.id === user.id && (
                            <span className="text-xs text-blue-500">Você</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{u.email}</td>
                    <td className="py-3">
                      <Badge variant={roleVariants[u.role]}>{formatRole(u.role)}</Badge>
                    </td>
                    <td className="py-3">
                      {u.is_active ? (
                        <div className="flex items-center gap-1 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Ativo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Inativo</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-gray-500 whitespace-nowrap">
                      {format(new Date(u.date_joined), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit2 className="w-4 h-4" />}
                        onClick={() => handleEditClick(u)}
                        disabled={u.id === user.id}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de edição */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Editar Usuário: ${editingUser?.full_name}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={updateUser.isPending}>Salvar Alterações</Button>
          </div>
        }
      >
        {editingUser && (
          <div className="space-y-5">
            {/* Info do usuário */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {editingUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editingUser.avatar_url} alt={editingUser.full_name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-medium">{editingUser.full_name.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{editingUser.full_name}</p>
                <p className="text-sm text-gray-500">{editingUser.email}</p>
              </div>
            </div>

            {/* Perfil */}
            <Select
              label="Perfil de Acesso"
              options={roleOptions}
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as Role)}
            />

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Status da Conta</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    checked={editActive}
                    onChange={() => setEditActive(true)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    checked={!editActive}
                    onChange={() => setEditActive(false)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Inativo</span>
                </label>
              </div>
              {!editActive && (
                <p className="text-xs text-red-600">
                  O usuário não conseguirá fazer login enquanto a conta estiver inativa.
                </p>
              )}
            </div>

            {updateUser.isError && (
              <p className="text-sm text-red-600">Erro ao salvar alterações. Tente novamente.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

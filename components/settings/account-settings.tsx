'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, User, Mail, Key } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface AccountSettingsProps {
  user: SupabaseUser
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : 'US'

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contrasenas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      toast.error('La contrasena debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success('Contrasena actualizada exitosamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      router.refresh()
    } catch (error) {
      toast.error('Error al actualizar la contrasena')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuenta</CardTitle>
        <CardDescription>
          Informacion de tu cuenta y seguridad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <User className="h-4 w-4" />
              Administrador
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-4 w-4" />
            <span className="font-medium">Cambiar Contrasena</span>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contrasena</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contrasena</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repetir contrasena"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Contrasena
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

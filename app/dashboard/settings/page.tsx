import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'
import { AccountSettings } from '@/components/settings/account-settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Ajusta las preferencias de tu cuenta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AccountSettings user={user} />
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}

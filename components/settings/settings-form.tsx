'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileSpreadsheet, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Settings {
  id: string
  master_accounts_url: string | null
  daily_report_url: string | null
}

interface SettingsFormProps {
  settings: Settings | null
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [masterAccountsUrl, setMasterAccountsUrl] = useState(settings?.master_accounts_url || '')
  const [dailyReportUrl, setDailyReportUrl] = useState(settings?.daily_report_url || '')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('No se pudo obtener el usuario')
        return
      }

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('settings')
          .update({
            master_accounts_url: masterAccountsUrl || null,
            daily_report_url: dailyReportUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Insert new settings
        const { error } = await supabase.from('settings').insert({
          user_id: user.id,
          master_accounts_url: masterAccountsUrl || null,
          daily_report_url: dailyReportUrl || null,
        })

        if (error) throw error
      }

      toast.success('Configuracion guardada exitosamente')
      router.refresh()
    } catch (error) {
      toast.error('Error al guardar la configuracion')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const openUrl = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <CardTitle>Google Sheets</CardTitle>
        </div>
        <CardDescription>
          Configura las URLs de tus hojas de calculo de Google para sincronizacion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="master-url">URL Maestro de Cuentas</Label>
            <div className="flex gap-2">
              <Input
                id="master-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={masterAccountsUrl}
                onChange={(e) => setMasterAccountsUrl(e.target.value)}
                className="flex-1"
              />
              {masterAccountsUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openUrl(masterAccountsUrl)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoja principal con el resumen de todas las cuentas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-url">URL Reporte Diario</Label>
            <div className="flex gap-2">
              <Input
                id="daily-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={dailyReportUrl}
                onChange={(e) => setDailyReportUrl(e.target.value)}
                className="flex-1"
              />
              {dailyReportUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openUrl(dailyReportUrl)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoja para el registro diario de cobros
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Configuracion
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

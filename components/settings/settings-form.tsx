'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileSpreadsheet, ExternalLink, RefreshCw } from 'lucide-react'
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
  const [isSyncing, setIsSyncing] = useState(false)
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

      const payload = {
        user_id: user.id,
        master_accounts_url: masterAccountsUrl || null,
        daily_report_url: dailyReportUrl || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = settings 
        ? await supabase.from('settings').update(payload).eq('user_id', user.id)
        : await supabase.from('settings').insert(payload)

      if (error) throw error

      toast.success('Configuración guardada exitosamente')
      router.refresh()
    } catch (error) {
      toast.error('Error al guardar la configuración')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // --- FUNCIÓN DE SINCRONIZACIÓN REAL ---
  const handleSyncData = async () => {
    if (!masterAccountsUrl) {
      toast.error('Primero guarda la URL del Maestro de Cuentas')
      return
    }

    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando datos de Google Sheets...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // 1. Convertir URL de Google Sheets a exportación CSV
      const csvUrl = masterAccountsUrl.includes('/edit') 
        ? masterAccountsUrl.replace(/\/edit.*$/, '/export?format=csv')
        : masterAccountsUrl + '&output=csv'

      const response = await fetch(csvUrl)
      const text = await response.text()

      // 2. Procesar CSV (Simple)
      // Asumimos: Columna A = Nombre, Columna B = Teléfono, Columna C = Dirección
      const rows = text.split('\n').slice(1) // Quitamos el encabezado
      
      const clientsToImport = rows
        .map(row => {
          const columns = row.split(',')
          return {
            full_name: columns[0]?.trim(),
            phone: columns[1]?.trim() || null,
            address: columns[2]?.trim() || null,
            user_id: user.id
          }
        })
        .filter(c => c.full_name && c.full_name.length > 2) // Evitar filas vacías

      if (clientsToImport.length === 0) {
        throw new Error('No se encontraron datos válidos en la hoja')
      }

      // 3. Insertar en Supabase (Upsert para no duplicar si tienen el mismo nombre)
      const { error: dbError } = await supabase
        .from('clients')
        .upsert(clientsToImport, { onConflict: 'full_name,user_id' })

      if (dbError) throw dbError

      toast.success(`¡Éxito! ${clientsToImport.length} clientes sincronizados`, { id: toastId })
      router.push('/dashboard/clients')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error('Error al sincronizar: Asegúrate que la hoja sea pública', { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  const openUrl = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <CardTitle>Google Sheets</CardTitle>
          </div>
          {settings?.master_accounts_url && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncData} 
              disabled={isSyncing}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sincronizar Datos
            </Button>
          )}
        </div>
        <CardDescription>
          Configura tus hojas de cálculo para importar clientes y reportes automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="master-url">URL Maestro de Cuentas (Clientes)</Label>
            <div className="flex gap-2">
              <Input
                id="master-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={masterAccountsUrl}
                onChange={(e) => setMasterAccountsUrl(e.target.value)}
                className="flex-1 font-mono text-xs"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-url">URL Reporte Diario (Pagos)</Label>
            <div className="flex gap-2">
              <Input
                id="daily-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={dailyReportUrl}
                onChange={(e) => setDailyReportUrl(e.target.value)}
                className="flex-1 font-mono text-xs"
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
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar URLs
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground italic">
              * Recuerda que el archivo de Google debe estar en modo "Cualquier persona con el enlace puede ver".
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

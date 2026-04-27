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

      // 1. Transformar URL de edición a exportación CSV pura
      const csvUrl = masterAccountsUrl.includes('/edit') 
        ? masterAccountsUrl.replace(/\/edit.*$/, '/export?format=csv')
        : masterAccountsUrl

      const response = await fetch(csvUrl)
      if (!response.ok) throw new Error('No se pudo acceder al archivo de Google Sheets')
      
      const text = await response.text()
      
      // 2. Procesar filas (soporta comas y puntos y comas)
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "")
      
      const clientsToImport = lines
        .map(line => {
          // Detectar separador común en CSV regionales
          const columns = line.includes(';') ? line.split(';') : line.split(',')
          
          // Limpiar comillas y espacios de Google
          const cleanName = columns[0]?.replace(/"/g, '').trim()
          const cleanPhone = columns[1]?.replace(/"/g, '').trim()
          const cleanAddress = columns[2]?.replace(/"/g, '').trim()

          return {
            full_name: cleanName,
            phone: cleanPhone || null,
            address: cleanAddress || null,
            user_id: user.id
          }
        })
        // FILTRO DE SEGURIDAD: Evita importar encabezados o filas vacías
        .filter(c => 
          c.full_name && 
          c.full_name.length > 2 && 
          !c.full_name.toLowerCase().includes('nombre') &&
          !c.full_name.toLowerCase().includes('maestro') &&
          !c.full_name.toLowerCase().includes('cliente') &&
          !c.full_name.toLowerCase().includes('full_name')
        )

      if (clientsToImport.length === 0) {
        throw new Error('No se encontraron datos en la Columna A. Revisa tu Excel.')
      }

      // 3. Insertar o Actualizar en Supabase
      // Usamos upsert para evitar duplicar si el nombre es idéntico
      const { error: dbError } = await supabase
        .from('clients')
        .upsert(clientsToImport, { onConflict: 'full_name,user_id' })

      if (dbError) throw dbError

      toast.success(`¡Éxito! ${clientsToImport.length} clientes sincronizados`, { id: toastId })
      
      // Pequeña pausa para que el usuario vea el éxito antes de recargar
      setTimeout(() => {
        router.push('/dashboard/clients')
        router.refresh()
      }, 1500)
      
    } catch (error: any) {
      console.error("Error en sincronización:", error)
      toast.error(error.message || 'Error al sincronizar datos', { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  const openUrl = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Google Sheets</CardTitle>
          </div>
          {masterAccountsUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncData} 
              disabled={isSyncing}
              className="text-green-700 border-green-200 hover:bg-green-50"
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sincronizar Datos
            </Button>
          )}
        </div>
        <CardDescription>
          Vincula tus hojas de cálculo para cargar clientes y cobros de forma masiva.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="master-url" className="text-xs font-bold uppercase text-slate-500">
              URL Maestro de Cuentas (Hoja de Clientes)
            </Label>
            <div className="flex gap-2">
              <Input
                id="master-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={masterAccountsUrl}
                onChange={(e) => setMasterAccountsUrl(e.target.value)}
                className="flex-1 font-mono text-xs bg-slate-50/50"
              />
              {masterAccountsUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => openUrl(masterAccountsUrl)}
                  title="Abrir hoja de cálculo"
                >
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              * El sistema leerá: Columna A (Nombre), B (Teléfono), C (Dirección).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-url" className="text-xs font-bold uppercase text-slate-500">
              URL Reporte Diario (Hoja de Cobros)
            </Label>
            <div className="flex gap-2">
              <Input
                id="daily-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={dailyReportUrl}
                onChange={(e) => setDailyReportUrl(e.target.value)}
                className="flex-1 font-mono text-xs bg-slate-50/50"
              />
              {dailyReportUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => openUrl(dailyReportUrl)}
                  title="Abrir reporte diario"
                >
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full font-bold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar URLs de Configuración
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

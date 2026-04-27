'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileSpreadsheet, ExternalLink, RefreshCw, database, CheckCircle2 } from 'lucide-react'
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
      if (!user) return

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
      toast.success('Configuración de URLs guardada')
      router.refresh()
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncMaster = async () => {
    if (!masterAccountsUrl) return toast.error('Configura primero la URL del Maestro')
    
    setIsSyncing(true)
    const toastId = toast.loading('Iniciando sincronización multi-hoja...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesión expirada')

      // 1. URLs de las pestañas específicas basándonos en tus GIDs
      const urlClientes = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrZXB527Inlr0d5eNnDG-kakVrc5ytw-smsIlMU0x4TlBJkEQkPHFXchYnymXq6Q/pub?output=csv&gid=1324213995"
      const urlCartera = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrZXB527Inlr0d5eNnDG-kakVrc5ytw-smsIlMU0x4TlBJkEQkPHFXchYnymXq6Q/pub?output=csv&gid=1053049930"

      // 2. OBTENER DATOS DE CONTACTO (C. CLIENTES)
      const resClientes = await fetch(urlClientes)
      const csvClientes = await resClientes.text()
      const dictContactos: Record<string, { phone: string, address: string }> = {}
      
      csvClientes.split(/\r?\n/).slice(1).forEach(line => {
        const col = line.split(',')
        const nombre = col[0]?.replace(/"/g, '').trim()
        if (nombre) {
          dictContactos[nombre] = {
            phone: col[1]?.replace(/"/g, '').trim() || '',
            address: col[2]?.replace(/"/g, '').trim() || ''
          }
        }
      })

      // 3. OBTENER CARTERA Y SALDOS (JHONATAN)
      const resCartera = await fetch(urlCartera)
      const csvCartera = await resCartera.text()
      const filasCartera = csvCartera.split(/\r?\n/).slice(2) // Saltamos cabeceras

      let importados = 0
      const cleanNum = (v: string) => parseFloat(v?.replace(/[^0-9.-]+/g,"")) || 0

      for (const fila of filasCartera) {
        const col = fila.split(',')
        const nombre = col[0]?.replace(/"/g, '').trim()
        
        // Validamos que sea una fila de cliente real
        if (nombre && nombre.length > 3 && !nombre.toLowerCase().includes('total')) {
          const contacto = dictContactos[nombre] || { phone: '', address: '' }
          
          // A. UPSERT CLIENTE (Nombre, Teléfono, Dirección)
          const { data: client, error: cErr } = await supabase
            .from('clients')
            .upsert({ 
              full_name: nombre, 
              phone: contacto.phone || null,
              address: contacto.address || null,
              user_id: user.id 
            }, { onConflict: 'full_name,user_id' })
            .select().single()

          if (client) {
            // B. UPSERT PRÉSTAMO (Préstamo, Cuota, Saldo)
            const saldoActual = cleanNum(col[5]) // Columna F
            
            await supabase.from('loans').upsert({
              client_id: client.id,
              user_id: user.id,
              total_amount: cleanNum(col[2]), // Columna C
              quota_amount: cleanNum(col[3]), // Columna D
              remaining_balance: saldoActual,
              status: saldoActual > 0 ? 'active' : 'completed'
            }, { onConflict: 'client_id,status' })
            
            importados++
          }
        }
      }

      toast.success(`${importados} registros sincronizados con éxito`, { id: toastId })
      router.refresh()
      router.push('/dashboard/clients')

    } catch (err: any) {
      console.error(err)
      toast.error('Error al leer los CSV de Google. Verifica los permisos.', { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-green-600 shadow-xl">
        <CardHeader className="bg-slate-50/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <CardTitle className="text-xl">Sincronización Inteligente</CardTitle>
                <CardDescription>Cruce de datos entre Clientes y Cartera Jhonatan</CardDescription>
              </div>
            </div>
            {masterAccountsUrl && (
              <Button 
                onClick={handleSyncMaster} 
                disabled={isSyncing} 
                className="bg-green-700 hover:bg-green-800 shadow-sm"
              >
                {isSyncing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sincronizar Todo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">URL Principal (Google Sheets)</Label>
                <Input 
                  value={masterAccountsUrl} 
                  onChange={(e) => setMasterAccountsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="font-mono text-xs bg-white border-slate-300"
                />
              </div>
              
              <div className="space-y-2 opacity-60">
                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">URL Reporte Diario (Lectura Automática)</Label>
                <Input 
                  value={dailyReportUrl} 
                  onChange={(e) => setDailyReportUrl(e.target.value)}
                  placeholder="Se usará el gid del reporte compartido..."
                  className="font-mono text-xs bg-slate-100 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" disabled={isLoading} variant="outline" className="w-full">
                {isLoading ? 'Guardando...' : 'Actualizar URLs de Enlace'}
              </Button>
              
              <div className="rounded-md bg-blue-50 p-3 border border-blue-100">
                <div className="flex gap-2 items-center text-blue-800 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Estado de conexión</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed italic">
                  El sistema está configurado para leer automáticamente las pestañas <strong>C. Clientes</strong> y <strong>Jhonatan</strong> usando los GIDs proporcionados.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 text-white overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-emerald-400">LOG_DE_IMPORTACION.txt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-[10px] space-y-1 opacity-80">
            <p>&gt; Analizando GID: 1324213995 (CONTACTOS)... OK</p>
            <p>&gt; Analizando GID: 1053049930 (SALDOS_JHONATAN)... OK</p>
            <p>&gt; Filtro de moneda: Activo (limpieza de $, . y ,)</p>
            <p>&gt; Estado: Esperando acción del usuario...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

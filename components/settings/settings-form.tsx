'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileSpreadsheet, ExternalLink, RefreshCw, database } from 'lucide-react'
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
      toast.success('URLs guardadas correctamente')
      router.refresh()
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncMaster = async () => {
    if (!masterAccountsUrl) return toast.error('Falta la URL del Maestro')
    
    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando Cartera Completa...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesión expirada')

      // 1. Obtener CSV de la hoja específica "MAESTRO"
      const csvUrl = masterAccountsUrl.replace(/\/edit.*$/, '/export?format=csv')
      const res = await fetch(csvUrl)
      const csvText = await res.text()
      
      // 2. Limpiar y Procesar Filas
      const rows = csvText.split(/\r?\n/).map(row => row.split(','))
      
      // Saltamos las primeras 2-3 filas de encabezados estéticos de tu Excel
      const clientsData = rows.slice(2).map(row => {
        const name = row[0]?.replace(/"/g, '').trim()
        // Limpiamos los números de símbolos como $ o puntos de miles
        const parseNum = (val: string) => parseFloat(val?.replace(/[^0-9.-]+/g,"")) || 0

        if (!name || name.length < 3 || name.toLowerCase().includes('total')) return null

        return {
          full_name: name,
          loan_amount: parseNum(row[2]),      // Columna C: Préstamo
          quota: parseNum(row[3]),            // Columna D: Cuota
          balance: parseNum(row[5]),          // Columna F: Saldo Real
          user_id: user.id
        }
      }).filter(Boolean)

      if (clientsData.length === 0) throw new Error('No se detectaron datos. Revisa el formato de la Hoja.')

      // 3. Carga Masiva (Clientes y luego Préstamos)
      for (const item of clientsData) {
        // Upsert Cliente
        const { data: client, error: cErr } = await supabase
          .from('clients')
          .upsert({ full_name: item.full_name, user_id: user.id }, { onConflict: 'full_name,user_id' })
          .select()
          .single()

        if (client) {
          // Upsert Préstamo Activo basado en el saldo del Excel
          await supabase.from('loans').upsert({
            client_id: client.id,
            user_id: user.id,
            total_amount: item.loan_amount,
            remaining_balance: item.balance,
            quota_amount: item.quota,
            status: item.balance > 0 ? 'active' : 'completed'
          }, { onConflict: 'client_id,status' })
        }
      }

      toast.success(`${clientsData.length} Clientes y Saldos actualizados`, { id: toastId })
      router.push('/dashboard/clients')
      router.refresh()

    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-green-600 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <CardTitle>Sincronización Maestra</CardTitle>
                <CardDescription>Carga masiva de clientes y estados de cuenta</CardDescription>
              </div>
            </div>
            {settings?.master_accounts_url && (
              <Button onClick={handleSyncMaster} disabled={isSyncing} variant="default" className="bg-green-700 hover:bg-green-800">
                {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sincronizar Cartera
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">URL del Maestro de Cuentas (Google Sheets)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={masterAccountsUrl} 
                    onChange={(e) => setMasterAccountsUrl(e.target.value)}
                    placeholder="Pega el link de edición aquí..."
                    className="font-mono text-xs bg-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">URL del Reporte Diario (Cobros)</Label>
                <Input 
                  value={dailyReportUrl} 
                  onChange={(e) => setDailyReportUrl(e.target.value)}
                  placeholder="Pega el link del reporte diario aquí..."
                  className="font-mono text-xs bg-slate-50"
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full mt-4">
              {isLoading ? 'Guardando...' : 'Guardar Configuración de URLs'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3 items-start text-blue-800 text-sm">
        <div className="font-bold">Nota:</div>
        <p>Asegúrate de que la Hoja de Google tenga los nombres en la <strong>Columna A</strong>, el valor del préstamo en la <strong>Columna C</strong> y el saldo en la <strong>Columna F</strong>.</p>
      </div>
    </div>
  )
}

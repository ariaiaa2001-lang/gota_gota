'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function SettingsForm({ settings }: { settings: any }) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [urlMaestro, setUrlMaestro] = useState(settings?.master_accounts_url || '')
  const [urlDiario, setUrlDiario] = useState(settings?.daily_report_url || '')
  const router = useRouter()

  const cleanNum = (val: string) => {
    if (!val) return 0
    return parseFloat(val.replace(/[$. ]/g, "").replace(",", ".")) || 0
  }

  const handleSync = async () => {
    const maestroClean = urlMaestro.replace(/[\[\]]/g, "").trim()
    const diarioClean = urlDiario.replace(/[\[\]]/g, "").trim()

    if (!maestroClean) return toast.error('La URL del Maestro es obligatoria')

    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando datos...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Sesión no encontrada")

      // Guardar URLs en Supabase
      await supabase.from('settings').upsert({ 
        user_id: user.id, 
        master_accounts_url: maestroClean,
        daily_report_url: diarioClean 
      })

      const baseMaestro = maestroClean.split('/pub')[0]
      
      // 1. IMPORTAR CLIENTES (DATOS CLIENTES - GID 1769110857)
      const resC = await fetch(`${baseMaestro}/pub?output=csv&gid=1769110857`)
      const csvC = await resC.text()
      const filasC = csvC.split(/\r?\n/).slice(1)
      
      for (const fila of filasC) {
        const c = fila.split(',')
        const nombre = c[2]?.replace(/"/g, '').trim() // Columna C
        if (nombre && nombre !== 'NOMBRE') {
          await supabase.from('clients').upsert({
            full_name: nombre,
            phone: c[3]?.replace(/"/g, '').trim() || null, // Columna D
            address: c[4]?.replace(/"/g, '').trim() || null, // Columna E
            user_id: user.id
          }, { onConflict: 'full_name,user_id' })
        }
      }

      // 2. IMPORTAR PRÉSTAMOS (JHONATAN - GID 1053049930)
      const resJ = await fetch(`${baseMaestro}/pub?output=csv&gid=1053049930`)
      const csvJ = await resJ.text()
      const filasJ = csvJ.split(/\r?\n/).slice(2)
      
      let countLoans = 0
      for (const fila of filasJ) {
        const c = fila.split(',')
        const nombre = c[0]?.replace(/"/g, '').trim() // Columna A

        if (nombre && !nombre.toLowerCase().includes('total')) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', nombre)
            .eq('user_id', user.id)
            .single()

          if (client) {
            const saldo = cleanNum(c[5]) // Columna F
            if (saldo > 0) {
              await supabase.from('loans').upsert({
                client_id: client.id,
                user_id: user.id,
                total_amount: cleanNum(c[2]), // Columna C
                quota_amount: cleanNum(c[3]), // Columna D
                remaining_balance: saldo,
                status: 'active'
              }, { onConflict: 'client_id,status' })
              countLoans++
            }
          }
        }
      }

      toast.success(`${countLoans} préstamos actualizados`, { id: toastId })
      router.refresh()
    } catch (e: any) {
      toast.error('Error: Verifique permisos de base de datos', { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sincronización de Google Sheets</CardTitle>
          <CardDescription>Conecta tus reportes Maestro y Diario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL Maestro (Reporte de Cuentas)</Label>
            <Input value={urlMaestro} onChange={(e) => setUrlMaestro(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>URL Reporte Diario (Cobros)</Label>
            <Input value={urlDiario} onChange={(e) => setUrlDiario(e.target.value)} />
          </div>
          <Button onClick={handleSync} disabled={isSyncing} className="w-full bg-green-600">
            {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
            Sincronizar Todo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

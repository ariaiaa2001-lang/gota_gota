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
    // Elimina $, puntos de miles y maneja decimales
    return parseFloat(val.replace(/[$. ]/g, "").replace(",", ".")) || 0
  }

  const handleSync = async () => {
    // Limpieza de URLs (quita corchetes y espacios accidentales)
    const maestroClean = urlMaestro.replace(/[\[\]]/g, "").trim()
    const diarioClean = urlDiario.replace(/[\[\]]/g, "").trim()

    if (!maestroClean) return toast.error('La URL del Maestro es obligatoria')

    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando datos de Google Sheets...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Sesión no encontrada")

      // 1. Guardar URLs en la base de datos
      await supabase.from('settings').upsert({ 
        user_id: user.id, 
        master_accounts_url: maestroClean,
        daily_report_url: diarioClean 
      })

      // --- PARTE A: PROCESAR MAESTRO (REPORTE DE CUENTAS) ---
      const baseMaestro = maestroClean.split('/pub')[0]
      
      // Importar Clientes (Pestaña DATOS CLIENTES - GID 1769110857)
      const resC = await fetch(`${baseMaestro}/pub?output=csv&gid=1769110857`)
      const csvC = await resC.text()
      const filasC = csvC.split(/\r?\n/).slice(1)
      
      for (const fila of filasC) {
        const c = fila.split(',')
        const nombre = c[2]?.replace(/"/g, '').trim() // Columna C: NOMBRE
        if (nombre && nombre !== 'NOMBRE' && nombre.length > 2) {
          await supabase.from('clients').upsert({
            full_name: nombre,
            phone: c[3]?.replace(/"/g, '').trim() || null, // Columna D: CELULAR
            address: c[4]?.replace(/"/g, '').trim() || null, // Columna E: TRABAJO
            user_id: user.id
          }, { onConflict: 'full_name,user_id' })
        }
      }

      // Importar Préstamos (Pestaña JHONATAN - GID 1053049930)
      const resJ = await fetch(`${baseMaestro}/pub?output=csv&gid=1053049930`)
      const csvJ = await resJ.text()
      const filasJ = csvJ.split(/\r?\n/).slice(2)
      
      let countLoans = 0
      for (const fila of filasJ) {
        const c = fila.split(',')
        const nombre = c[0]?.replace(/"/g, '').trim() // Columna A: NOMBRE

        if (nombre && !nombre.toLowerCase().includes('total')) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', nombre)
            .eq('user_id', user.id)
            .single()

          if (client) {
            const saldo = cleanNum(c[5]) // Columna F: SALDO ACTUAL
            if (saldo > 0) {
              await supabase.from('loans').upsert({
                client_id: client.id,
                user_id: user.id,
                total_amount: cleanNum(c[2]), // Columna C: VALOR P.
                quota_amount: cleanNum(c[3]), // Columna D: CUOTA
                remaining_balance: saldo,
                status: 'active'
              }, { onConflict: 'client_id,status' })
              countLoans++
            }
          }
        }
      }

      // --- PARTE B: PROCESAR REPORTE DIARIO (COBROS) ---
      if (diarioClean) {
        const baseDiario = diarioClean.split('/pub')[0]
        // GID de la pestaña de cobros del día (ej. 678428839 según tu captura)
        const resD = await fetch(`${baseDiario}/pub?output=csv&gid=678428839`)
        const csvD = await resD.text()
        // Aquí podrías añadir lógica para registrar los pagos del día en la tabla 'payments'
      }

      toast.success(`${countLoans} préstamos actualizados correctamente`, { id: toastId })
      router.refresh()
    } catch (e: any) {
      console.error(e)
      toast.error('Error de sincronización. Verifica las políticas RLS.', { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Sincronización de Google Sheets</CardTitle>
              <CardDescription>Conecta tus archivos de cuentas y cobros diarios</CardDescription>
            </div>
            <Button onClick={handleSync} disabled={isSyncing} className="bg-green-600 hover:bg-green-700">
              {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
              Sincronizar Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="maestro">URL Maestro (Reporte de Cuentas)</Label>
              <Input 
                id="maestro"
                value={urlMaestro} 
                onChange={(e) => setUrlMaestro(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=csv"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="diario">URL Reporte Diario (Cobros)</Label>
              <Input 
                id="diario"
                value={urlDiario} 
                onChange={(e) => setUrlDiario(e.target.value)}
                placeholder="URL del archivo Reporte Diario Nuevo..."
              />
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex gap-3 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>
              Asegúrate de que ambos archivos estén en <strong>"Archivo" &gt; "Compartir" &gt; "Publicar en la Web"</strong> como 
              <strong> Valores separados por comas (.csv)</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

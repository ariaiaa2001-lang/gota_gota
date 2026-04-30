'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function SettingsForm({ settings }: { settings: any }) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [masterAccountsUrl, setMasterAccountsUrl] = useState(settings?.master_accounts_url || '')
  const router = useRouter()

  const cleanNum = (val: string) => {
    if (!val) return 0
    // Elimina símbolos de moneda, puntos de miles y espacios
    return parseFloat(val.replace(/[$. ]/g, "").replace(",", ".")) || 0
  }

  const handleSync = async () => {
    if (!masterAccountsUrl) return toast.error('Configura la URL de publicación primero')
    if (!masterAccountsUrl.includes('/pub')) {
        return toast.error('Usa el enlace de "Publicar en la Web" (que termina en output=csv)')
    }

    setIsSyncing(true)
    const toastId = toast.loading('Iniciando sincronización...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error("No hay sesión de usuario activa")

      // Limpiamos la URL base para asegurar que pedimos CSV
      const baseUrl = masterAccountsUrl.split('/pub')[0];
      
      // GIDs Reales de tu documento:
      // DATOS CLIENTES: 1769110857
      // JHONATAN: 1053049930
      const urlClientes = `${baseUrl}/pub?output=csv&gid=1769110857`
      const urlJhonatan = `${baseUrl}/pub?output=csv&gid=1053049930`

      // 1. CARGAR DATOS DE CONTACTO (Pestaña: DATOS CLIENTES)
      const resC = await fetch(urlClientes)
      const csvC = await resC.text()
      const contactos: Record<string, any> = {}
      
      csvC.split(/\r?\n/).forEach(line => {
        const c = line.split(',')
        // Según tu Excel: Columna C (índice 2) es NOMBRE
        const nombre = c[2]?.replace(/"/g, '').trim()
        if (nombre && nombre !== 'NOMBRE') {
          contactos[nombre] = { 
            tel: c[3]?.replace(/"/g, '').trim(), // Columna D: CELULAR
            dir: c[4]?.replace(/"/g, '').trim(), // Columna E: TRABAJO
            rec: c[5]?.replace(/"/g, '').trim()  // Columna F: RECOMENDADO
          }
        }
      })

      // 2. CARGAR PRÉSTAMOS (Pestaña: JHONATAN)
      const resJ = await fetch(urlJhonatan)
      const csvJ = await resJ.text()
      const filas = csvJ.split(/\r?\n/)
      
      let count = 0
      // Empezamos en i=2 para saltar encabezados
      for (let i = 2; i < filas.length; i++) {
        const c = filas[i].split(',')
        const nombre = c[0]?.replace(/"/g, '').trim() // En JHONATAN el nombre es Columna A

        if (nombre && nombre.length > 3 && !nombre.toLowerCase().includes('total')) {
          const info = contactos[nombre] || {}
          
          // Upsert Cliente
          const { data: client, error: clientErr } = await supabase.from('clients').upsert({
            full_name: nombre,
            phone: info.tel || null,
            address: info.dir || null,
            recommended_by: info.rec || null,
            user_id: user.id
          }, { onConflict: 'full_name,user_id' }).select().single()

          if (clientErr) {
            console.error(`Error con cliente ${nombre}:`, clientErr.message)
            continue
          }

          if (client) {
            const saldo = cleanNum(c[5]) // Columna F: SALDO ACTUAL
            if (saldo > 0) {
              const { error: loanErr } = await supabase.from('loans').upsert({
                client_id: client.id,
                user_id: user.id,
                total_amount: cleanNum(c[2]), // Columna C: VALOR P.
                quota_amount: cleanNum(c[3]), // Columna D: CUOTA
                remaining_balance: saldo,
                status: 'active'
              }, { onConflict: 'client_id,status' })

              if (!loanErr) count++
            }
          }
        }
      }

      toast.success(`${count} préstamos activos sincronizados`, { id: toastId })
      router.refresh()
    } catch (e: any) {
      toast.error('Error: ' + e.message, { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Configuración de Google Sheets</CardTitle>
            <Button onClick={handleSync} disabled={isSyncing} className="bg-green-600 hover:bg-green-700">
              {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
              Sincronizar Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL de Publicación (.csv)</Label>
            <Input 
              value={masterAccountsUrl} 
              onChange={(e) => setMasterAccountsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=csv"
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700 flex gap-3 border border-blue-100">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p>
              <strong>Instrucciones:</strong> El sistema leerá la pestaña <strong>DATOS CLIENTES</strong> para contactos 
              y la pestaña <strong>JHONATAN</strong> para saldos y cuotas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

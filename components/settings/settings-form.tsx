'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileSpreadsheet, RefreshCw, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function SettingsForm({ settings }: { settings: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [masterAccountsUrl, setMasterAccountsUrl] = useState(settings?.master_accounts_url || '')
  const router = useRouter()

  const cleanNum = (val: string) => {
    if (!val) return 0
    return parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0
  }

  const handleSync = async () => {
    if (!masterAccountsUrl) return toast.error('Configura la URL primero')
    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando datos...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. URLs con tus GIDs específicos
      const baseUrl = masterAccountsUrl.includes('/edit') 
        ? masterAccountsUrl.split('/edit')[0] 
        : masterAccountsUrl.split('/pub')[0];
      
      const urlClientes = `${baseUrl}/pub?output=csv&gid=1324213995` // C. CLIENTES
      const urlJhonatan = `${baseUrl}/pub?output=csv&gid=1053049930` // JHONATAN

      // 2. Cargar Contactos (Pestaña C. CLIENTES)
      const resC = await fetch(urlClientes)
      const csvC = await resC.text()
      const contactos: Record<string, any> = {}
      
      csvC.split('\n').forEach(line => {
        const c = line.split(',')
        const nombre = c[0]?.replace(/"/g, '').trim()
        if (nombre) contactos[nombre] = { tel: c[1], dir: c[2] }
      })

      // 3. Cargar Cartera (Pestaña JHONATAN)
      const resJ = await fetch(urlJhonatan)
      const csvJ = await resJ.text()
      const filas = csvJ.split('\n')
      
      let count = 0
      // Empezamos desde la fila 3 para saltar encabezados del Excel
      for (let i = 2; i < filas.length; i++) {
        const c = filas[i].split(',')
        const nombre = c[0]?.replace(/"/g, '').trim()

        if (nombre && nombre.length > 3 && !nombre.toLowerCase().includes('total')) {
          const info = contactos[nombre] || {}
          
          // Crear/Actualizar Cliente
          const { data: client } = await supabase.from('clients').upsert({
            full_name: nombre,
            phone: info.tel || null,
            address: info.dir || null,
            user_id: user?.id
          }, { onConflict: 'full_name,user_id' }).select().single()

          if (client) {
            const saldo = cleanNum(c[5]) // Columna F
            if (saldo > 0) {
              await supabase.from('loans').upsert({
                client_id: client.id,
                user_id: user?.id,
                total_amount: cleanNum(c[2]), // Columna C
                quota_amount: cleanNum(c[3]), // Columna D
                remaining_balance: saldo,
                status: 'active'
              }, { onConflict: 'client_id,status' })
              count++
            }
          }
        }
      }

      toast.success(`${count} registros sincronizados`, { id: toastId })
      router.refresh()
    } catch (e) {
      toast.error('Error de conexión con Google', { id: toastId })
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
            <Button onClick={handleSync} disabled={isSyncing} className="bg-green-600">
              {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
              Sincronizar Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL de Publicación del Maestro de Cuentas</Label>
            <Input 
              value={masterAccountsUrl} 
              onChange={(e) => setMasterAccountsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700 flex gap-2">
            <CheckCircle2 className="h-4 w-4" />
            El sistema leerá automáticamente las pestañas "C. Clientes" y "Jhonatan".
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

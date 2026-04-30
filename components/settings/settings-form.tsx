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
    return parseFloat(val.replace(/[$. ]/g, "").replace(",", ".")) || 0
  }

  const handleSync = async () => {
    // 1. Limpieza de URL (Elimina cualquier espacio o corchete accidental)
    const cleanUrl = masterAccountsUrl.replace(/[\[\]]/g, "").trim();
    if (!cleanUrl) return toast.error('Copia el enlace de publicación de nuevo');

    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando carteras...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Inicia sesión nuevamente")

      // 2. Guardar la URL limpia en la base de datos primero
      await supabase.from('settings').upsert({ 
        user_id: user.id, 
        master_accounts_url: cleanUrl 
      });

      const baseUrl = cleanUrl.split('/pub')[0];
      const urlClientes = `${baseUrl}/pub?output=csv&gid=1769110857`; // DATOS CLIENTES
      const urlJhonatan = `${baseUrl}/pub?output=csv&gid=1053049930`; // JHONATAN

      // 3. PASO A: Importar Clientes (Nombres y Teléfonos)
      const resC = await fetch(urlClientes);
      const csvC = await resC.text();
      const filasC = csvC.split(/\r?\n/).slice(1);
      
      for (const fila of filasC) {
        const c = fila.split(',');
        const nombre = c[2]?.replace(/"/g, '').trim(); // Columna C
        if (nombre && nombre !== 'NOMBRE') {
          await supabase.from('clients').upsert({
            full_name: nombre,
            phone: c[3]?.replace(/"/g, '').trim() || null, // Columna D
            address: c[4]?.replace(/"/g, '').trim() || null, // Columna E
            user_id: user.id
          }, { onConflict: 'full_name,user_id' });
        }
      }

      // 4. PASO B: Vincular Préstamos y Saldos (Pestaña JHONATAN)
      const resJ = await fetch(urlJhonatan);
      const csvJ = await resJ.text();
      const filasJ = csvJ.split(/\r?\n/).slice(2);
      
      let count = 0;
      for (const fila of filasJ) {
        const c = fila.split(',');
        const nombre = c[0]?.replace(/"/g, '').trim(); // Columna A

        if (nombre && !nombre.toLowerCase().includes('total')) {
          // Buscamos el ID del cliente que acabamos de crear
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', nombre)
            .eq('user_id', user.id)
            .single();

          if (client) {
            const saldo = cleanNum(c[5]); // Columna F
            if (saldo > 0) {
              await supabase.from('loans').upsert({
                client_id: client.id,
                user_id: user.id,
                total_amount: cleanNum(c[2]), // Columna C
                quota_amount: cleanNum(c[3]), // Columna D
                remaining_balance: saldo,
                status: 'active'
              }, { onConflict: 'client_id,status' });
              count++;
            }
          }
        }
      }

      toast.success(`${count} préstamos cargados con éxito`, { id: toastId });
      router.refresh();
    } catch (e: any) {
      console.error(e);
      toast.error('Error de lectura. Verifica que el archivo esté publicado.', { id: toastId });
    } finally {
      setIsSyncing(false);
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
            <Label>URL de Publicación (.csv)</Label>
            <Input 
              value={masterAccountsUrl} 
              onChange={(e) => setMasterAccountsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=csv"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Verificar usuario
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div className="p-10 text-center">No has iniciado sesión.</div>
  }

  // 2. Consulta ultra-simple (sin joins de loans)
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error de Supabase:", error.message)
  }

  // 3. Mapeo seguro de datos
  const formattedClients = (clients || []).map((c: any) => ({
    ...c,
    // Priorizamos full_name que es el estándar de tu DB
    name: c.full_name || c.name || "Sin nombre",
    loans: [] // Array vacío para que la tabla no rompa al buscar .length
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Total registrados: {formattedClients.length}
          </p>
        </div>
        <AddClientDialog />
      </div>

      <hr className="border-muted" />

      {formattedClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed">
          <Users className="h-10 w-10 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium">No se encontraron clientes</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Intenta agregar uno nuevo para verificar la conexión.
          </p>
          <AddClientDialog />
        </div>
      ) : (
        <ClientsTable clients={formattedClients} />
      )}
    </div>
  )
}

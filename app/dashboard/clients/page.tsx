import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div className="p-6">No has iniciado sesión.</div>
  }

  // Consulta simple para evitar errores de relación
  const { data: clients, error: dbError } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (dbError) {
    console.error("Error cargando clientes:", dbError.message)
  }

  const formattedClients = (clients || []).map(client => ({
    ...client,
    name: client.full_name || client.name || "Sin nombre",
    loans: [] 
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Total: {formattedClients.length}
          </p>
        </div>
        <AddClientDialog />
      </div>

      <hr className="border-muted" />

      {formattedClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed">
          <Users className="h-10 w-10 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium">No hay clientes</h3>
          <p className="text-sm text-muted-foreground mb-6">Agrega uno para comenzar.</p>
          <AddClientDialog />
        </div>
      ) : (
        <ClientsTable clients={formattedClients} />
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { Users, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Sesión no encontrada.</p>
      </div>
    )
  }

  // CONSULTA SIMPLIFICADA: Eliminamos el join de 'loans' para que no falle
  const { data: clients, error: dbError } = await supabase
    .from('clients')
    .select('*') 
    .order('created_at', { ascending: false })

  const formattedClients = (clients || []).map(client => ({
    ...client,
    name: client.full_name || client.name || "Sin nombre",
    loans: [] // Lo mandamos vacío por ahora
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes ({formattedClients.length})
          </p>
        </div>
        <AddClientDialog />
      </div>

      <hr className="border-muted" />

      {dbError && (
        <div className="bg-destructive/10 p-4 rounded-lg flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Error: {dbError.message}</p>
        </div>
      )}

      {formattedClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <Users className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No hay clientes visibles</h3>
          <AddClientDialog />
        </div>
      ) : (
        <ClientsTable clients={formattedClients} />
      )}
    </div>
  )
}

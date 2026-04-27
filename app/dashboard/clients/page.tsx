import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { UserPlus, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Validamos la sesión del usuario
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Sesión no encontrada. Por favor inicia sesión de nuevo.</p>
      </div>
    )
  }

  // 2. Consulta a la base de datos
  const { data: clients, error: dbError } = await supabase
    .from('clients')
    .select(`
      *,
      loans (
        id,
        status,
        remaining_balance
      )
    `)
    .order('created_at', { ascending: false })

  if (dbError) {
    console.error("Error de Supabase:", dbError.message)
  }

  // 3. Normalización de datos
  const formattedClients = (clients || []).map(client => ({
    ...client,
    name: client.full_name || client.name || "Sin nombre",
    loans: client.loans || []
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

      {formattedClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <Users className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No se encontraron clientes</h3>
          <p className="text-slate-500 text-sm max-w-xs text-center mt-1 mb-6">
            Tu cartera está vacía. Comienza registrando a tu primer cliente para gestionar sus préstamos.
          </p>
          <AddClientDialog />
        </div>
      ) : (
        <ClientsTable clients={formattedClients} />
      )}
    </div>
  )
}

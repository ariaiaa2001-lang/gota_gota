import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // Obtenemos el usuario para el diagnóstico
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Consulta limpia sin filtros de user_id (para ver si los datos bajan)
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans(id, status, remaining_balance)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error en Supabase:", error.message)
  }

  // Normalizamos para asegurar que 'name' y 'loans' siempre existan
  const formattedClients = (clients || []).map(client => ({
    ...client,
    name: client.name || client.full_name || "Sin nombre",
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

      {/* Si formattedClients es 0, mostramos un mensaje informativo en lugar de la tabla vacía */}
      {formattedClients.length === 0 ? (
        <div className="p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-muted/5">
          <p className="text-lg font-medium">No se encontraron datos</p>
          <p className="text-sm text-muted-foreground mb-4">
            Los datos existen en Supabase pero no están llegando. Verifica el RLS.
          </p>
          <div className="text-[10px] font-mono bg-black text-green-400 p-2 rounded">
            DB_COUNT: {clients?.length || 0} | USER_ID: {user.id.slice(0,8)}...
          </div>
        </div>
      ) : (
        <ClientsTable clients={formattedClients} />
      )}
    </div>
  )
}

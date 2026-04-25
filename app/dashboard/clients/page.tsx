import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

// ESTO ES VITAL: Fuerza a Next.js a no usar caché y buscar datos frescos cada vez
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Realizamos la misma consulta que el Dashboard para asegurar consistencia
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans(id, status, remaining_balance)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error cargando clientes:", error.message)
  }

  // NORMALIZACIÓN DE DATOS: 
  // En tu DB tienes registros con 'name' y otros con 'full_name'.
  // Esto asegura que ClientsTable siempre reciba un nombre para mostrar.
  const clientsWithStats = (clients || []).map((client: any) => ({
    ...client,
    full_name: client.full_name || client.name || "Cliente sin nombre",
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes ({clientsWithStats.length})
          </p>
        </div>
        <AddClientDialog />
      </div>

      {/* Si el dashboard marca 3 pero aquí no ves nada, el problema es el componente ClientsTable */}
      <ClientsTable clients={clientsWithStats} />
    </div>
  )
}

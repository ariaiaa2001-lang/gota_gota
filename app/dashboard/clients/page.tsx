import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

// 1. FORZAR ACTUALIZACIÓN: Esto evita que la página se quede "pegada" con 0 clientes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 2. CONSULTA: Traemos los clientes asignados a este usuario
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans(id, status, remaining_balance)
    `)
    .eq('user_id', user.id) // Filtro de seguridad
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error cargando clientes:", error.message)
  }

  // 3. MAPEO DE SEGURIDAD:
  // Aseguramos que 'full_name' tenga contenido (basado en lo que vimos en tu DB)
  const formattedClients = (clients || []).map(client => ({
    ...client,
    full_name: client.full_name || client.name || "Sin nombre"
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

      <ClientsTable clients={formattedClients} />
    </div>
  )
}

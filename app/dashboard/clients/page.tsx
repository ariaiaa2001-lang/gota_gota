import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Verificamos sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Consulta ultra-segura
  // Traemos todo de 'clients' para asegurar datos
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error de Supabase:", error.message)
  }

  // 3. NORMALIZACIÓN CRÍTICA:
  // El error de 'filter' ocurre porque 'clients' es null y el componente no sabe manejarlo.
  // Aquí nos aseguramos de que SIEMPRE sea un array, aunque esté vacío.
  const formattedClients = Array.isArray(clients) 
    ? clients.map(client => ({
        ...client,
        id: client.id,
        name: client.full_name || client.name || "Sin nombre",
        full_name: client.full_name || client.name || "Sin nombre",
        phone: client.phone || "---",
        status: client.status || 'active'
      }))
    : [] // Si clients es null, mandamos un array vacío para que .filter() no explote

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

      {/* Si la tabla sigue dando error de filter, es que el error está dentro de ClientsTable.
          Este bloque nos mostrará si realmente recibimos algo de la base de datos. */}
      {formattedClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50">
          <p className="text-lg font-medium">No se detectaron datos en la base de datos</p>
          <p className="text-sm text-muted-foreground">
            Verifica que la tabla 'clients' tenga registros y que las políticas RLS estén desactivadas.
          </p>
        </div>
      ) : (
        <ClientsTable clients={formattedClients} />
      )}
    </div>
  )
}

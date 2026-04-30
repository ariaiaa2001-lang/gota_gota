import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // Traemos TODO de la tabla clients sin filtros ni relaciones raras
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*') 
    .order('full_name', { ascending: true })

  if (error) {
    console.error("Error de Supabase:", error.message)
  }

  // Normalizamos los datos para que la tabla los entienda
  const formattedClients = (clients || []).map(client => ({
    ...client,
    // Forzamos el uso de full_name que es lo que tienes en Supabase
    name: client.full_name || "Sin nombre", 
    loans: [] // Lo dejamos vacío por ahora para que no de error
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Total en base de datos: {formattedClients.length}
          </p>
        </div>
        <AddClientDialog />
      </div>

      <hr className="border-muted" />

      {formattedClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed">
          <h3 className="text-lg font-semibold">No se encontraron clientes</h3>
          <p className="text-sm text-muted-foreground mb-4">La base de datos devolvió 0 registros.</p>
          <AddClientDialog />
        </div>
      ) : (
        <ClientsTable clients={formattedClients} />
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // Verificación de usuario rápida
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-10">Acceso denegado.</div>

  // Consulta plana: traemos todo de la tabla 'clients'
  const { data: rawClients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error cargando tabla:", error.message)
  }

  // Formateo de datos a prueba de errores
  const clients = (rawClients || []).map((item) => ({
    ...item,
    name: item.full_name || item.name || "Sin nombre",
    loans: [] // Evita errores de lectura en la tabla de componentes
  }))

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cartera de Clientes</h1>
          <p className="text-sm text-muted-foreground">Registros actuales: {clients.length}</p>
        </div>
        <AddClientDialog />
      </header>

      <hr className="opacity-10" />

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No se encontraron registros de clientes.</p>
        </div>
      ) : (
        <ClientsTable clients={clients} />
      )}
    </div>
  )
}

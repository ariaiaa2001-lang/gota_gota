import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // Obtenemos el usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // CAMBIO CLAVE: 
  // Si eres el administrador, quizás quieras ver TODOS los clientes.
  // Por ahora, vamos a quitar el .eq('user_id', user.id) para confirmar que los datos bajan.
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans(id, status, remaining_balance)
    `)
    // .eq('user_id', user.id) <--- COMENTA ESTA LÍNEA PARA PROBAR
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error en la consulta de clientes:", error.message)
  }

  // NORMALIZACIÓN: Aseguramos que los campos coincidan con lo que ClientsTable espera
  const formattedClients = (clients || []).map(client => ({
    ...client,
    // Si tu tabla espera 'name' pero en la DB es 'full_name', esto lo arregla:
    name: client.full_name || client.name || "Sin nombre",
    full_name: client.full_name || client.name || "Sin nombre",
    // Agregamos conteo de préstamos para evitar errores en la tabla
    loans_count: client.loans?.length || 0
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

      {/* Si formattedClients tiene datos pero la tabla sigue vacía, 
          puedes poner este JSON temporalmente para ver si llegan datos: */}
      {/* <pre className="text-[10px] bg-black text-white p-2">{JSON.stringify(formattedClients, null, 2)}</pre> */}

      <ClientsTable clients={formattedClients} />
    </div>
  )
}

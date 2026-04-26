import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

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
  // Traemos los clientes y sus préstamos asociados
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
  // Esto asegura que la tabla no se rompa si faltan campos (Undefined/Null)
  const formattedClients = (clients || []).map(client => ({
    ...client,
    // Priorizamos 'full_name' que es lo que vi con datos en tu captura
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
        <div className="p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-muted/5">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-amber-600">No se detectaron datos en la vista</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              El usuario está autenticado, pero el RLS de Supabase está filtrando los registros.
            </p>
          </div>
          
          {/* Bloque de diagnóstico técnico */}
          <div className="mt-6 flex flex-col gap-2 font-mono text-[10px] bg-slate-950 text-emerald-400 p-4 rounded-lg shadow-inner">
            <p className="border-b border-emerald-900 pb-1 mb-1 text-emerald-600">DIAGNÓSTICO DEL SISTEMA</p>
            <p>SESIÓN_ACTIVA: ✅ {user.email}</p>
            <p>USER_ID_AUTH: {user.id}</p>
            <p>REGISTROS_DB: {clients?.length || 0}</p>
            {dbError && <p className="text-red-400">ERROR_DB: {dbError.message}</p>}
          </div>
        </div>
      ) : (
        <ClientsTable clients={formattedClients} />
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Verificamos sesión (solo para debug)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. CONSULTA SIN FILTROS Y SIN RELACIONES (Para descartar errores de tabla loans)
  // Intentamos traer TODO de la tabla clients
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*') // Primero solo '*' para asegurar que la tabla existe y responde
    .order('created_at', { ascending: false })

  // LOGS PARA LA TERMINAL (Revisa tu consola de VS Code o Vercel)
  if (error) {
    console.error("DEBUG: Error de Supabase:", error.message)
    console.error("DEBUG: Código de error:", error.code)
  }
  
  console.log("DEBUG: Clientes encontrados en DB:", clients?.length)

  // 3. NORMALIZACIÓN TOTAL
  const formattedClients = (clients || []).map(client => ({
    ...client,
    id: client.id,
    // Forzamos que 'name' tenga algo para que la tabla lo pinte
    name: client.full_name || client.name || "Cliente sin nombre",
    phone: client.phone || "N/A",
    status: client.status || 'active'
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

      {/* BLOQUE DE DIAGNÓSTICO VISUAL: Si esto sale rojo, hay un problema grave */}
      {formattedClients.length === 0 && (
        <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg">
          <h2 className="text-red-700 font-bold">Diagnóstico del Sistema:</h2>
          <ul className="text-sm text-red-600 list-disc ml-5">
            <li>Usuario logueado: {user ? user.email : "NO"}</li>
            <li>Error de Query: {error ? error.message : "Ninguno"}</li>
            <li>Registros recibidos: {clients ? clients.length : 0}</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500 italic">
            Si "Registros recibidos" es 0 pero ves datos en el panel de Supabase, revisa tus variables de entorno (SUPABASE_URL) en Vercel.
          </p>
        </div>
      )}

      {/* Solo mostramos la tabla si hay datos, si no, se queda el diagnóstico arriba */}
      {formattedClients.length > 0 ? (
        <ClientsTable clients={formattedClients} />
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
           <p className="text-muted-foreground">Esperando datos de la base de datos...</p>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  // Envolvemos todo en un try-catch para evitar el Error 500 y ver qué pasa
  try {
    const supabase = await createClient()
    
    // 1. Verificamos sesión de forma segura
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    if (!user) {
      return (
        <div className="p-6">
          <p className="text-red-500">Error: No se detectó una sesión activa.</p>
        </div>
      )
    }

    // 2. Consulta ultra-básica (Solo clientes, sin relaciones)
    const { data: clients, error: supabaseError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (supabaseError) {
      throw new Error(supabaseError.message)
    }

    // 3. Formateo a prueba de errores
    // Aseguramos que 'clients' sea siempre un array y que tenga las propiedades mínimas
    const formattedClients = (clients || []).map(client => ({
      ...client,
      id: client.id || Math.random().toString(),
      name: client.full_name || client.name || "Sin nombre",
      phone: client.phone || "N/A",
      status: client.status || 'active'
    }))

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gestiona tu cartera ({formattedClients.length})
            </p>
          </div>
          <AddClientDialog />
        </div>

        {/* Verificación de seguridad antes de llamar al componente de la tabla */}
        {formattedClients.length > 0 ? (
          <ClientsTable clients={formattedClients} />
        ) : (
          <div className="p-12 border-2 border-dashed rounded-lg text-center">
            <p className="text-muted-foreground">No hay clientes registrados en este proyecto.</p>
            <p className="text-xs mt-2 text-gray-400">ID Usuario: {user.id}</p>
          </div>
        )}
      </div>
    )

  } catch (error: any) {
    // Si algo falla, lo mostramos en pantalla en lugar de dar Error 500
    return (
      <div className="p-10 bg-red-50 border border-red-200 m-6 rounded-xl">
        <h2 className="text-red-800 font-bold text-lg">Error Crítico de Servidor</h2>
        <pre className="mt-4 p-4 bg-white rounded border text-xs text-red-600 overflow-auto">
          {error.message || "Error desconocido al cargar la página"}
        </pre>
        <p className="mt-4 text-sm text-gray-600">
          Revisa que las variables de entorno en Vercel no tengan espacios o comillas extra.
        </p>
      </div>
    )
  }
}

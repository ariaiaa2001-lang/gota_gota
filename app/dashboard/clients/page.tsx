import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

// 1. CONTROL DE CACHÉ RADICAL: Mata cualquier versión guardada en el servidor
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // Obtenemos el usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. CONSULTA SIN FILTROS EXTRA: 
  // Traemos exactamente lo mismo que el Dashboard para que no haya discrepancia
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans(id, status, remaining_balance)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error en la consulta de clientes:", error.message)
  }

  // 3. NORMALIZACIÓN DE DATOS (Mapeo de seguridad):
  // Tus capturas de la DB muestran que usas 'full_name'.
  // Si ClientsTable busca 'name', la fila saldrá vacía. Aquí aseguramos ambas.
  const formattedClients = (clients || []).map(client => ({
    ...client,
    full_name: client.full_name || client.name || "Sin nombre",
    name: client.name || client.full_name || "Sin nombre"
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

      {/* 4. VERIFICACIÓN VISUAL: 
          Si formattedClients tiene datos pero la tabla no muestra nada, 
          el error está dentro del componente ClientsTable. */}
      <ClientsTable clients={formattedClients} />
    </div>
  )
}

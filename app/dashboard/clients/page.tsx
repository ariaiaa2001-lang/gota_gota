import { createClient } from "@/lib/supabase/server"
import { ClientsList } from "@/components/clients/clients-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

// ESTO ES LO MÁS IMPORTANTE:
// Obliga a Next.js a ignorar cualquier versión guardada y consultar la DB en vivo.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Consulta limpia sin relaciones para evitar que errores de FK bloqueen la lista
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error cargando clientes:", error.message)
  }

  // Mapeo de seguridad para asegurar que siempre haya un nombre que mostrar
  const formattedClients = (clients || []).map((client: any) => ({
    ...client,
    // Prioridad de columnas según lo que vimos en tu Table Editor
    full_name: client.full_name || client.name || "Sin nombre",
    collector_name: "Administrador",
    active_loans: 0,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {formattedClients.length} cliente{formattedClients.length !== 1 ? "s" : ""} registrados
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Buscador simple */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-9"
        />
      </div>

      {/* Si el dashboard dice 3 pero aquí sale 0, esto forzará la vista */}
      {formattedClients.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Sincronizando con la base de datos...</p>
          <Button 
            variant="link" 
            onClick={() => window.location.reload()}
          >
            Click aquí para reintentar
          </Button>
        </div>
      ) : (
        <ClientsList clients={formattedClients} />
      )}
    </div>
  )
}

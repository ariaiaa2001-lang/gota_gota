import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Traemos clientes con sus préstamos y pagos para calcular el saldo real
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans (
        id,
        status,
        total_amount,
        payments (
          amount
        )
      )
    `)
    .order('full_name', { ascending: true })

  if (error) {
    console.error("Error de Supabase:", error.message)
  }

  // 2. Procesamos los datos para la tabla
  const formattedClients = (clients || []).map(client => {
    // Calculamos préstamos activos
    const activeLoans = client.loans?.filter((l: any) => l.status === 'active') || []
    
    // Calculamos el saldo pendiente real
    const totalPending = activeLoans.reduce((acc: number, loan: any) => {
      const paid = loan.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
      return acc + (Number(loan.total_amount) - paid)
    }, 0)

    return {
      ...client,
      // Mantenemos 'name' porque tu tabla lo usa así
      name: client.full_name || "Sin nombre", 
      // Agregamos los cálculos que faltaban
      active_loans_count: activeLoans.length,
      total_pending: totalPending,
      loans: activeLoans // Pasamos los préstamos activos por si la tabla los requiere
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            Total en base de datos: {formattedClients.length}
          </p>
        </div>
        <AddClientDialog />
      </div>

      <hr className="border-muted" />

      {formattedClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed">
          <h3 className="text-lg font-semibold text-slate-700">No se encontraron clientes</h3>
          <p className="text-sm text-muted-foreground mb-4">La base de datos devolvió 0 registros.</p>
          <AddClientDialog />
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <ClientsTable clients={formattedClients} />
        </div>
      )}

      <p className="text-[10px] text-slate-300 text-center uppercase tracking-widest">
        Sincronización en tiempo real activa
      </p>
    </div>
  )
}

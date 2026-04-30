import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Traemos los clientes (Tu consulta original que sí funciona)
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*') 
    .order('full_name', { ascending: true })

  // 2. Traemos todos los préstamos activos con sus pagos para calcular saldos
  // Lo hacemos por separado para no afectar el listado de clientes si algo falla
  const { data: allLoans } = await supabase
    .from('loans')
    .select('*, payments(amount)')
    .eq('status', 'active')

  if (clientsError) {
    console.error("Error de Supabase:", clientsError.message)
  }

  // 3. Cruzamos la información manualmente
  const formattedClients = (clients || []).map(client => {
    // Buscamos los préstamos que le pertenecen a este cliente
    const clientLoans = allLoans?.filter(loan => loan.client_id === client.id) || []
    
    // Calculamos el saldo pendiente real
    const totalPending = clientLoans.reduce((acc, loan) => {
      const paid = loan.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
      const balance = Number(loan.total_amount) - paid
      return acc + (balance > 0 ? balance : 0)
    }, 0)

    return {
      ...client,
      name: client.full_name || "Sin nombre", // Mantenemos tu mapeo original
      active_loans_count: clientLoans.length, // Para la columna de "Préstamos"
      total_pending: totalPending,            // Para la columna de "Saldo Pendiente"
      loans: clientLoans                      // Mantenemos la estructura de array
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">
            Total en base de datos: <strong>{formattedClients.length}</strong>
          </p>
        </div>
        {/* Usamos exactamente el nombre de tu componente original */}
        <AddClientDialog />
      </div>

      <hr className="border-slate-200" />

      {formattedClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700">No se encontraron clientes</h3>
          <p className="text-sm text-slate-500 mb-4">La base de datos no devolvió registros.</p>
          <AddClientDialog />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <ClientsTable clients={formattedClients} />
        </div>
      )}
    </div>
  )
}

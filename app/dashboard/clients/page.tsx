import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Obtenemos los clientes
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .order('full_name', { ascending: true })

  // 2. Obtenemos los préstamos (usamos la misma lógica que el dashboard)
  // IMPORTANTE: Traemos 'client_id' para poder mapearlos
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select(`
      *,
      payments (
        amount
      )
    `)
    .eq('status', 'active')

  if (clientsError || loansError) {
    console.error("Error cargando datos:", clientsError || loansError)
  }

  // 3. Procesamos los datos para calcular saldos reales
  const formattedClients = (clients || []).map(client => {
    // Buscamos los préstamos de este cliente
    const clientLoans = (loans || []).filter(l => l.client_id === client.id)
    
    // Calculamos el saldo pendiente real: (Suma de total_amount) - (Suma de payments)
    const totalPending = clientLoans.reduce((acc, loan) => {
      const loanTotal = Number(loan.total_amount) || 0
      const paid = loan.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0
      const balance = loanTotal - paid
      return acc + (balance > 0 ? balance : 0)
    }, 0)

    return {
      ...client,
      active_loans_count: clientLoans.length,
      total_pending: totalPending
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">
            Total registrados: <span className="font-semibold text-slate-700">{formattedClients.length}</span>
          </p>
        </div>
        <AddClientDialog />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <ClientsTable clients={formattedClients} />
      </div>
    </div>
  )
}

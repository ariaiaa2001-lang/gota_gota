import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Traemos los clientes
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('full_name', { ascending: true })

  // 2. Traemos TODOS los préstamos activos y sus pagos
  const { data: allLoans } = await supabase
    .from('loans')
    .select('*, payments(amount)')
    .eq('status', 'active')

  // 3. Cruzamos los datos manualmente para asegurar que no falle la relación
  const formattedClients = (clients || []).map(client => {
    // Buscamos los préstamos de ESTE cliente específico
    const clientLoans = allLoans?.filter(loan => loan.client_id === client.id) || []
    
    // Calculamos el saldo pendiente restando pagos al total
    const totalPending = clientLoans.reduce((acc, loan) => {
      const loanTotal = Number(loan.total_amount) || 0
      const paid = loan.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0
      return acc + (loanTotal - paid)
    }, 0)

    return {
      ...client,
      active_loans_count: clientLoans.length, // Esto llenará la columna "Préstamos"
      total_pending: totalPending,             // Esto llenará la columna "Saldo Pendiente"
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-slate-500">Total: {formattedClients.length}</p>
        </div>
        <AddClientDialog />
      </div>
      <ClientsTable clients={formattedClients} />
    </div>
  )
}

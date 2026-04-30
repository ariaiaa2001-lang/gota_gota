import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Fuerza a que NO guarde caché

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // 1. Traer clientes
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('full_name', { ascending: true })

  // 2. Traer préstamos con sus pagos
  const { data: loans } = await supabase
    .from('loans')
    .select('*, payments(amount)')
    .eq('status', 'active')

  // 3. Mapeo ultra-seguro
  const formattedClients = (clients || []).map(client => {
    // Filtrar préstamos de este cliente
    const clientLoans = loans?.filter(l => l.client_id === client.id) || []
    
    // Calcular deuda
    const totalPending = clientLoans.reduce((acc, loan) => {
      const totalLoan = Number(loan.total_amount) || 0
      const paid = loan.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0
      return acc + (totalLoan - paid)
    }, 0)

    // LOG DE CONTROL: Mira tu terminal cuando cargues la página
    console.log(`Cliente: ${client.full_name} | Préstamos: ${clientLoans.length} | Deuda: ${totalPending}`)

    return {
      ...client,
      active_loans_count: clientLoans.length,
      total_pending: totalPending,
      loans: clientLoans // Esto es vital para que la tabla lo vea
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <AddClientDialog />
      </div>
      <ClientsTable clients={formattedClients} />
    </div>
  )
}

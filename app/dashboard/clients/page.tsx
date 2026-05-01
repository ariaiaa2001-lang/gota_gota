import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Traemos clientes y préstamos del usuario (Igual que en el dashboard)
  const [
    { data: clients },
    { data: loans }
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('full_name', { ascending: true }),
    supabase
      .from('loans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
  ])

  // 2. Mapeamos usando la columna 'remaining_balance' que ya existe en tu DB
  const formattedClients = (clients || []).map(client => {
    const clientLoans = loans?.filter(l => l.client_id === client.id) || []
    
    // Usamos 'remaining_balance' tal cual lo hace tu dashboard
    const totalPending = clientLoans.reduce((sum, loan) => sum + Number(loan.remaining_balance), 0)

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
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            Total en base de datos: {formattedClients.length}
          </p>
        </div>
        <AddClientDialog />
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <ClientsTable clients={formattedClients} />
      </div>
    </div>
  )
}

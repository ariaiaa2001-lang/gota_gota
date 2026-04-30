import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()

  // 1. Verificación de sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Consulta Completa: Clientes + sus Préstamos + sus Pagos
  // Traemos todo para calcular el saldo real en el servidor
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
    console.error("Error cargando clientes:", error)
  }

  // 3. Lógica de cálculo de saldos
  const formattedClients = (clients || []).map(client => {
    // Filtramos solo préstamos que no estén pagados/cerrados
    const activeLoans = client.loans?.filter((l: any) => l.status === 'active') || []
    
    // Calculamos el saldo pendiente total de todos sus préstamos activos
    const totalPending = activeLoans.reduce((acc: number, loan: any) => {
      const paid = loan.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
      return acc + (Number(loan.total_amount) - paid)
    }, 0)

    return {
      ...client,
      active_loans_count: activeLoans.length,
      total_pending: totalPending
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clientes</h1>
          <p className="text-sm text-slate-500">
            Total en base de datos: {formattedClients.length}
          </p>
        </div>
        <CreateClientDialog />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Pasamos los datos calculados a la tabla */}
        <ClientsTable clients={formattedClients} />
      </div>
    </div>
  )
}

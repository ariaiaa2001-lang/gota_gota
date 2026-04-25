import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentPayments } from '@/components/dashboard/recent-payments'
import { ActiveLoans } from '@/components/dashboard/active-loans'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch dashboard stats
  const [
    { data: clients },
    { data: loans },
    { data: payments },
    { data: expenses },
  ] = await Promise.all([
    supabase.from('clients').select('id').eq('user_id', user.id),
    supabase.from('loans').select('*').eq('user_id', user.id),
    supabase.from('payments').select('*, clients(name), loans(daily_payment)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('expenses').select('amount').eq('user_id', user.id),
  ])

  const activeLoans = loans?.filter(l => l.status === 'active') || []
  const totalLent = activeLoans.reduce((sum, loan) => sum + Number(loan.principal_amount), 0)
  const totalToCollect = activeLoans.reduce((sum, loan) => sum + Number(loan.remaining_balance), 0)
  const todayCollections = activeLoans.reduce((sum, loan) => sum + Number(loan.daily_payment), 0)
  const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

  const stats = {
    totalClients: clients?.length || 0,
    activeLoans: activeLoans.length,
    totalLent,
    totalToCollect,
    todayCollections,
    totalExpenses,
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de tu cartera de prestamos
        </p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ActiveLoans loans={activeLoans.slice(0, 5)} />
        <RecentPayments payments={payments || []} />
      </div>
    </div>
  )
}

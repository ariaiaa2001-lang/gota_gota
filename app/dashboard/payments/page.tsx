import { createClient } from '@/lib/supabase/server'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsSummary } from '@/components/payments/payments-summary'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [{ data: payments }, { data: todayPayments }, { data: monthPayments }] = await Promise.all([
    supabase
      .from('payments')
      .select(`
        *,
        clients(name),
        loans(principal_amount, daily_payment)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('payments')
      .select('amount')
      .eq('user_id', user.id)
      .eq('payment_date', today),
    supabase
      .from('payments')
      .select('amount')
      .eq('user_id', user.id)
      .gte('payment_date', startOfMonth),
  ])

  const todayTotal = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const todayCount = todayPayments?.length || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cobros</h1>
        <p className="text-muted-foreground">
          Historial de pagos recibidos
        </p>
      </div>

      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayCount}
      />

      <PaymentsTable payments={payments || []} />
    </div>
  )
}

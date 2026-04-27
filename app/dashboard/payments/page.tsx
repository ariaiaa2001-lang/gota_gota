import { createClient } from '@/lib/supabase/server'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsSummary } from '@/components/payments/payments-summary'
import { redirect } from 'next/navigation'

// Esto asegura que Vercel no intente pre-renderizar la página sin datos de usuario
export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  // 1. Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fechas para el resumen
  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // 3. Obtener datos
  const [{ data: payments }, { data: todayPayments }, { data: monthPayments }] = await Promise.all([
    supabase
      .from('payments')
      .select(`
        *,
        clients(name, full_name),
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

  // 4. Cálculos
  const todayTotal = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const todayCount = todayPayments?.length || 0

  // 5. Formatear para la tabla
  const formattedPayments = (payments || []).map(p => ({
    ...p,
    client_name: p.clients?.name || p.clients?.full_name || "N/A",
    loan_info: p.loans ? `Capital: ${p.loans.principal_amount}` : "N/A"
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historial de Cobros</h1>
        <p className="text-muted-foreground">Gestiona los pagos recibidos</p>
      </div>

      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayCount}
      />

      <div className="rounded-md border bg-card">
        <PaymentsTable payments={formattedPayments} />
      </div>
    </div>
  )
}

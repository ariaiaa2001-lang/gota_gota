import { createClient } from '@/lib/supabase/server'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsSummary } from '@/components/payments/payments-summary'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // 1. Quitamos el .eq('user_id') para verificar si hay datos globales
  const [paymentsRes, todayRes, monthRes] = await Promise.all([
    supabase
      .from('payments')
      .select(`
        *,
        clients ( full_name ),
        loans ( principal_amount, daily_payment )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('amount')
      .eq('payment_date', today),
    supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startOfMonth),
  ])

  const payments = paymentsRes.data || []
  const todayTotal = todayRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const formattedPayments = payments.map(p => ({
    ...p,
    client_name: (p as any).clients?.full_name || "Cliente Desconocido",
    loan_info: (p as any).loans ? `Préstamo: ${(p as any).loans.principal_amount}` : "N/A"
  }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Historial de Cobros</h1>
      
      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayRes.data?.length || 0}
      />

      <div className="rounded-xl border bg-white shadow-sm">
        <PaymentsTable payments={formattedPayments} />
      </div>

      {payments.length === 0 && (
        <div className="p-10 text-center border-2 border-dashed rounded-xl text-slate-400">
          La base de datos de pagos está vacía. 
          Ejecuta un INSERT de prueba o registra un cobro manual.
        </div>
      )}
    </div>
  )
}

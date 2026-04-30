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

  // Ejecutamos las consultas con manejo de errores más visible
  const [paymentsRes, todayRes, monthRes] = await Promise.all([
    supabase
      .from('payments')
      .select(`
        *,
        clients ( id, full_name ),
        loans ( id, principal_amount, daily_payment )
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('payments')
      .select('amount')
      .eq('payment_date', today),
    supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startOfMonth),
  ])

  // DEBUG: Si hay errores de relación, los verás en la consola de tu terminal
  if (paymentsRes.error) {
    console.error("Error en cobros:", paymentsRes.error.message)
  }

  const payments = paymentsRes.data || []
  const todayPayments = todayRes.data || []
  const monthPayments = monthRes.data || []

  const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const monthTotal = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const todayCount = todayPayments.length

  const formattedPayments = payments.map(p => ({
    ...p,
    // Verificamos si los datos vienen de 'clients' o 'loans'
    client_name: (p as any).clients?.full_name || "Cliente no encontrado",
    loan_info: (p as any).loans 
      ? `Cuota: ${(p as any).loans.daily_payment}` 
      : "Sin info de préstamo"
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Historial de Cobros</h1>
          <p className="text-muted-foreground text-sm">Gestiona los pagos recibidos y el flujo de caja.</p>
        </div>
      </div>

      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayCount}
      />

      {paymentsRes.error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
          <strong>Aviso de sincronización:</strong> {paymentsRes.error.message}. 
          Verifica que existan las relaciones entre pagos, clientes y préstamos en la DB.
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <PaymentsTable payments={formattedPayments} />
      </div>
    </div>
  )
}

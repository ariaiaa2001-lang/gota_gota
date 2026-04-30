import { createClient } from '@/lib/supabase/server'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsSummary } from '@/components/payments/payments-summary'
import { CreatePaymentDialog } from '@/components/payments/create-payment-dialog'
import { QuickPayButton } from '@/components/payments/quick-pay-button'
import { redirect } from 'next/navigation'

// Forzamos que la página no use caché para ver los pagos al instante
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  // 1. Verificación de sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // 2. Consulta de Datos (Préstamos activos + Pagos)
  const [loansRes, paymentsRes, todayRes, monthRes] = await Promise.all([
    supabase
      .from('loans')
      .select('*, clients(full_name)')
      .eq('status', 'active'),
    supabase
      .from('payments')
      .select(`
        *,
        clients ( full_name ),
        loans ( principal_amount, daily_payment )
      `)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('payments')
      .select('amount, loan_id')
      .eq('payment_date', today),
    supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startOfMonth),
  ])

  // 3. Lógica de "Ruta del Día" (Pendientes vs Pagados)
  const activeLoans = loansRes.data || []
  const allPayments = paymentsRes.data || []
  const todayPaymentsData = todayRes.data || []
  
  // Creamos un set con los IDs de préstamos que ya recibieron pago hoy
  const paidLoanIds = new Set(todayPaymentsData.map(p => p.loan_id))
  
  // Filtramos los préstamos que NO están en el set de pagados
  const pendingPayments = activeLoans.filter(loan => !paidLoanIds.has(loan.id))

  // 4. Cálculos para el resumen
  const todayTotal = todayPaymentsData.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const todayCount = todayPaymentsData.length

  // 5. Formateo para la tabla de historial
  const formattedPayments = allPayments.map(p => ({
    ...p,
    client_name: (p as any).clients?.full_name || "Cliente no identificado",
    loan_info: (p as any).loans 
      ? `Cuota: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format((p as any).loans.daily_payment)}` 
      : "N/A"
  }))

  return (
    <div className="p-6 space-y-8">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ruta de Cobro</h1>
          <p className="text-sm text-slate-500">
            {pendingPayments.length > 0 
              ? `Tienes ${pendingPayments.length} cobros pendientes para hoy.` 
              : '¡Día completado! No quedan cobros pendientes.'}
          </p>
        </div>
        <CreatePaymentDialog />
      </div>

      {/* RESUMEN DE TOTALES */}
      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayCount}
      />

      {/* SECCIÓN 1: PENDIENTES (CARDS DE COBRO RÁPIDO) */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Pendientes de hoy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingPayments.map((loan) => (
            <div key={loan.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
              <div className="space-y-1">
                <p className="font-bold text-slate-700">{(loan as any).clients?.full_name}</p>
                <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                  Cuota: ${new Intl.NumberFormat('es-CO').format(loan.daily_payment)}
                </p>
              </div>
              <QuickPayButton 
                loanId={loan.id} 
                clientId={loan.client_id} 
                amount={loan.daily_payment} 
              />
            </div>
          ))}
          {pendingPayments.length === 0 && (
            <div className="col-span-full py-10 text-center bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl">
              <p className="text-emerald-700 font-medium">✅ Todos los cobros del día han sido realizados</p>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: HISTORIAL DE COBROS */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Historial Reciente</h2>
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {formattedPayments.length > 0 ? (
            <PaymentsTable payments={formattedPayments} />
          ) : (
            <div className="p-12 text-center text-slate-400">
              No hay registros de cobros aún.
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
        Sistema de Gestión | Operador: {user.email}
      </p>
    </div>
  )
}

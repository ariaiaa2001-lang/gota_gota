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

  // 2. Consulta de Datos Multidimensión
  const [loansRes, historyRes, todayRes, monthRes] = await Promise.all([
    // Ruta: Préstamos activos para cobrar
    supabase
      .from('loans')
      .select('*, clients(full_name)')
      .eq('status', 'active'),
    // Historial: Los últimos 20 pagos realizados globalmente
    supabase
      .from('payments')
      .select(`
        *,
        clients ( full_name ),
        loans ( principal_amount, daily_payment )
      `)
      .order('created_at', { ascending: false })
      .limit(20),
    // Totales: Lo que ha entrado HOY
    supabase
      .from('payments')
      .select('amount, loan_id')
      .eq('payment_date', today),
    // Totales: Lo que ha entrado el MES
    supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startOfMonth),
  ])

  // 3. Procesamiento de la "Ruta de Cobro"
  const activeLoans = loansRes.data || []
  const todayPaymentsData = todayRes.data || []
  const historyPayments = historyRes.data || []
  
  // Identificamos quién ya pagó hoy para quitarlo de la lista de pendientes
  const paidLoanIds = new Set(todayPaymentsData.map(p => p.loan_id))
  const pendingPayments = activeLoans.filter(loan => !paidLoanIds.has(loan.id))

  // 4. Cálculos para las tarjetas superiores
  const todayTotal = todayPaymentsData.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const todayCount = todayPaymentsData.length

  // 5. Formateo de datos para la tabla de historial
  const formattedHistory = historyPayments.map(p => ({
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
              ? `Faltan ${pendingPayments.length} clientes por cobrar hoy.` 
              : '¡Excelente trabajo! No tienes cobros pendientes.'}
          </p>
        </div>
        <CreatePaymentDialog />
      </div>

      {/* RESUMEN DE DINERO */}
      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayCount}
      />

      {/* SECCIÓN: RUTA DEL DÍA (PENDIENTES) */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Pendientes de hoy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingPayments.map((loan) => (
            <div key={loan.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 uppercase text-sm">{(loan as any).clients?.full_name}</p>
                <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
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
            <div className="col-span-full py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 font-medium">No hay cobros pendientes para mostrar.</p>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN: HISTORIAL DE PAGOS */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Historial Reciente</h2>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {formattedHistory.length > 0 ? (
            <PaymentsTable payments={formattedHistory} />
          ) : (
            <div className="p-12 text-center text-slate-400">
              Todavía no se han registrado cobros en el sistema.
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-slate-300 text-center uppercase tracking-[0.2em] pt-4">
        Sistema de Gestión Profesional | Operador: {user.email}
      </p>
    </div>
  )
}

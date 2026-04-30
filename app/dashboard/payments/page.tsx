import { createClient } from '@/lib/supabase/server'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsSummary } from '@/components/payments/payments-summary'
import { CreatePaymentDialog } from '@/components/payments/create-payment-dialog'
import { QuickPayButton } from '@/components/payments/quick-pay-button'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // CONSULTAS
  const [loansRes, historyRes, todayRes, monthRes] = await Promise.all([
    supabase.from('loans').select('*, clients(full_name)').eq('status', 'active'),
    // Traemos pagos con join a clientes para el historial
    supabase.from('payments').select('*, clients(full_name)').order('created_at', { ascending: false }).limit(20),
    supabase.from('payments').select('amount, loan_id').eq('payment_date', today),
    supabase.from('payments').select('amount').gte('payment_date', startOfMonth),
  ])

  const activeLoans = loansRes.data || []
  const todayPaymentsData = todayRes.data || []
  const historyRaw = historyRes.data || []
  
  const paidLoanIds = new Set(todayPaymentsData.map(p => p.loan_id))
  const pendingPayments = activeLoans.filter(loan => !paidLoanIds.has(loan.id))

  const todayTotal = todayPaymentsData.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const todayCount = todayPaymentsData.length

  // FORMATEO SEGURO
  const formattedHistory = historyRaw.map(p => ({
    ...p,
    client_name: (p as any).clients?.full_name || "Cliente Desconocido",
    // Si no tenemos la info del préstamo en esta consulta, ponemos un texto genérico
    loan_info: "Cobro realizado"
  }))

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ruta de Cobro</h1>
          <p className="text-sm text-slate-500">Gestión de recaudos diarios</p>
        </div>
        <CreatePaymentDialog />
      </div>

      <PaymentsSummary todayTotal={todayTotal} monthTotal={monthTotal} todayCount={todayCount} />

      {/* SECCIÓN PENDIENTES */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Pendientes de hoy ({pendingPayments.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingPayments.map((loan) => (
            <div key={loan.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 uppercase text-sm">{(loan as any).clients?.full_name}</p>
                <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                  ${new Intl.NumberFormat('es-CO').format(loan.daily_payment)}
                </p>
              </div>
              <QuickPayButton loanId={loan.id} clientId={loan.client_id} amount={loan.daily_payment} />
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN HISTORIAL - Aquí es donde debería salir la data */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Historial Reciente</h2>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {formattedHistory.length > 0 ? (
            <PaymentsTable payments={formattedHistory} />
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400 font-medium italic">No se detectan pagos en la base de datos.</p>
              <p className="text-xs text-slate-300">Revisa la tabla 'payments' en Supabase.</p>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-[10px] text-slate-300 text-center uppercase tracking-[0.2em]">
        Sistema de Gestión | Operador: {user.email}
      </p>
    </div>
  )
}

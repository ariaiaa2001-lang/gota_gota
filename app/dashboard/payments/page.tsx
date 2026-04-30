import { createClient } from '@/lib/supabase/server'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsSummary } from '@/components/payments/payments-summary'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  // 1. Verificación de seguridad
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // 2. Consulta de datos con relaciones
  const [paymentsRes, todayRes, monthRes] = await Promise.all([
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
      .select('amount')
      .eq('payment_date', today),
    supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startOfMonth),
  ])

  const payments = paymentsRes.data || []
  
  // 3. Cálculos para el Resumen
  const todayTotal = todayRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const todayCount = todayRes.data?.length || 0

  // 4. Formateo de datos para la tabla
  const formattedPayments = payments.map(p => ({
    ...p,
    client_name: (p as any).clients?.full_name || "Cliente no identificado",
    loan_info: (p as any).loans 
      ? `Crédito: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format((p as any).loans.principal_amount)}` 
      : "N/A"
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera con botón de acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Historial de Cobros</h1>
          <p className="text-sm text-slate-500">Consulta y registra los pagos recibidos hoy.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all">
          <PlusCircle className="mr-2 h-4 w-4" />
          Registrar Cobro Manual
        </Button>
      </div>

      {/* Resumen de totales (Cuadritos de arriba) */}
      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayCount}
      />

      {/* Alerta si no hay datos */}
      {payments.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <PlusCircle className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-blue-900 font-semibold text-lg">No hay cobros registrados</h3>
          <p className="text-blue-700/70 text-sm max-w-xs mx-auto mt-1">
            Los pagos que realices hoy aparecerán en esta lista automáticamente.
          </p>
        </div>
      )}

      {/* Tabla de resultados */}
      {payments.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <PaymentsTable payments={formattedPayments} />
        </div>
      )}

      {/* Footer informativo */}
      <p className="text-[10px] text-slate-400 text-center">
        ID de Operador: {user.id} | Sincronización en tiempo real activa
      </p>
    </div>
  )
}

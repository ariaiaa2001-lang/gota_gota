import { createClient } from '@/lib/supabase/server'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsSummary } from '@/components/payments/payments-summary'
import { redirect } from 'next/navigation'

// Esto es CRUCIAL: evita que los datos se queden "pegados" y obliga a leer Supabase siempre
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  // 1. Verificación de seguridad
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Preparación de fechas para el resumen
  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // 3. Consulta triple a la base de datos (Historial, Total Hoy, Total Mes)
  const [{ data: payments, error: paymentsError }, { data: todayPayments }, { data: monthPayments }] = await Promise.all([
    supabase
      .from('payments')
      .select(`
        *,
        clients (
          name,
          full_name
        ),
        loans (
          principal_amount,
          daily_payment,
          total_amount
        )
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

  if (paymentsError) {
    console.error("Error cargando cobros:", paymentsError.message)
  }

  // 4. Cálculos para los cuadros de resumen
  const todayTotal = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const todayCount = todayPayments?.length || 0

  // 5. Normalización de datos (para evitar errores de "undefined" en la tabla)
  const formattedPayments = (payments || []).map(payment => ({
    ...payment,
    client_name: payment.clients?.name || payment.clients?.full_name || "Cliente eliminado",
    loan_info: payment.loans ? `${payment.loans.principal_amount} (Cuota: ${payment.loans.daily_payment})` : "N/A"
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Historial de Cobros</h1>
        <p className="text-muted-foreground">
          Revisa y gestiona los pagos recibidos. Los cambios se reflejan automáticamente en los saldos.
        </p>
      </div>

      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayCount}
      />

      <div className="rounded-md border bg-card">
        <PaymentsTable payments={formattedPayments} />
      </div>

      {formattedPayments.length === 0 && (
        <div className="text-center p-10 bg-muted/10 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">No se encontraron cobros registrados hoy.</p>
        </div>
      )}
    </div>
  )
}

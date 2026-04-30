import { createClient } from '@/lib/supabase/server'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsSummary } from '@/components/payments/payments-summary'
import { CreatePaymentDialog } from '@/components/payments/create-payment-dialog'
import { redirect } from 'next/navigation'

// Forzar que la página siempre busque datos frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  // 1. Verificación de sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Configuración de fechas (Hoy y Primero de mes)
  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // 3. Consulta de datos (Historial, Total Hoy, Total Mes)
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
  
  // 4. Cálculos para las tarjetas de resumen
  const todayTotal = todayRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthTotal = monthRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const todayCount = todayRes.data?.length || 0

  // 5. Formateo de datos para la tabla
  const formattedPayments = payments.map(p => ({
    ...p,
    client_name: (p as any).clients?.full_name || "Cliente no identificado",
    loan_info: (p as any).loans 
      ? `Cuota: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format((p as any).loans.daily_payment)}` 
      : "N/A"
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera con el Botón Funcional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Historial de Cobros</h1>
          <p className="text-sm text-slate-500">Consulta y registra los pagos recibidos hoy.</p>
        </div>
        
        {/* Este componente es el que creamos para abrir el modal */}
        <CreatePaymentDialog />
      </div>

      {/* Resumen de totales */}
      <PaymentsSummary
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        todayCount={todayCount}
      />

      {/* Tabla o Mensaje de "No hay datos" */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {payments.length > 0 ? (
          <PaymentsTable payments={formattedPayments} />
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-500 font-medium">No se encontraron cobros registrados.</p>
            <p className="text-slate-400 text-sm">Usa el botón superior para registrar el primero.</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
        Sistema de Gestión | Operador: {user.email}
      </p>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { redirect } from 'next/navigation'

// Forzamos que los datos se refresquen siempre
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientsPage() {
  const supabase = await createClient()

  // 1. Verificación de seguridad
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Consulta Maestra: Clientes + Préstamos Activos + Pagos realizados
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans (
        id,
        status,
        total_amount,
        payments (
          amount
        )
      )
    `)
    .order('full_name', { ascending: true })

  if (error) {
    console.error("Error al obtener clientes:", error.message)
  }

  // 3. Procesamiento de saldos en el servidor
  const formattedClients = (clients || []).map(client => {
    // Solo tomamos en cuenta los préstamos que están en estado 'active'
    const activeLoans = client.loans?.filter((l: any) => l.status === 'active') || []
    
    // Calculamos el saldo pendiente total (Suma de Préstamos - Suma de Pagos)
    const totalPending = activeLoans.reduce((acc: number, loan: any) => {
      const paid = loan.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
      const balance = Number(loan.total_amount) - paid
      return acc + (balance > 0 ? balance : 0)
    }, 0)

    return {
      ...client,
      active_loans_count: activeLoans.length, // Esto actualizará la columna "Préstamos"
      total_pending: totalPending             // Esto actualizará la columna "Saldo Pendiente"
    }
  })

  return (
    <div className="p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Clientes</h1>
          <p className="text-sm text-slate-500">
            Total de clientes registrados: <span className="font-semibold text-slate-700">{formattedClients.length}</span>
          </p>
        </div>
        
        {/* Este es el componente que lanzaba el error de "Module not found" */}
        <CreateClientDialog />
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {formattedClients.length > 0 ? (
          <ClientsTable clients={formattedClients} />
        ) : (
          <div className="p-20 text-center">
            <p className="text-slate-400">No hay clientes registrados en el sistema.</p>
          </div>
        )}
      </div>

      {/* FOOTER DE ESTADO */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
          Base de datos conectada | {new Date().toLocaleDateString('es-CO')}
        </p>
      </div>
    </div>
  )
}

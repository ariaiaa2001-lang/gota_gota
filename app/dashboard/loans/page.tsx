import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// Forzamos que los datos siempre estén frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LoansPage() {
  const supabase = await createClient()

  // Traemos los préstamos ordenados por fecha, incluyendo el nombre del cliente
  const { data: loans, error } = await supabase
    .from('loans')
    .select(`
      *,
      clients (
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  const formatCOP = (val: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Préstamos Realizados</h1>
          <p className="text-sm text-muted-foreground">Listado general de créditos y saldos pendientes.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {loans?.filter(l => l.status === 'active').length || 0} Activos
          </Badge>
          <Badge variant="outline" className="bg-slate-50 text-slate-600">
            {loans?.length || 0} Total
          </Badge>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          Error al cargar datos: {error.message}
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Monto Prestado</TableHead>
              <TableHead className="font-semibold">Saldo Pendiente</TableHead>
              <TableHead className="font-semibold">Cuota Diaria</TableHead>
              <TableHead className="font-semibold">Fecha Inicio</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans && loans.length > 0 ? (
              loans.map((loan: any) => (
                <TableRow key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-700">
                    {loan.clients?.full_name || 'Desconocido'}
                  </TableCell>
                  <TableCell>{formatCOP(loan.principal_amount)}</TableCell>
                  <TableCell>
                    <span className={loan.remaining_balance > 0 ? "text-red-600 font-bold" : "text-slate-400"}>
                      {formatCOP(loan.remaining_balance)}
                    </span>
                  </TableCell>
                  <TableCell>{formatCOP(loan.daily_payment)}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(loan.created_at).toLocaleDateString('es-CO')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold"
                      style={{
                        backgroundColor: loan.status === 'active' ? '#dcfce7' : '#f1f5f9',
                        color: loan.status === 'active' ? '#166534' : '#475569',
                        border: `1px solid ${loan.status === 'active' ? '#bbf7d0' : '#e2e8f0'}`
                      }}
                    >
                      {loan.status === 'active' ? 'Vigente' : 'Pagado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No hay préstamos registrados actualmente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

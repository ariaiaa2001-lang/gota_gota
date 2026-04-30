import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// Forzamos a que no use caché para ver los cambios de SQL de inmediato
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LoansPage() {
  const supabase = await createClient()

  // 1. Obtenemos el usuario actual para verificar la sesión
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Traemos los préstamos con el nombre del cliente
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
      {/* CUADRO DE DEPURACIÓN: Solo para entender por qué no salen los datos */}
      <div className="p-4 bg-slate-100 border-l-4 border-blue-500 rounded text-xs font-mono">
        <p className="font-bold mb-1 text-blue-700">DEBUG INFO:</p>
        <p>Usuario Autenticado ID: <span className="text-red-600">{user?.id || 'No detectado'}</span></p>
        <p>Error Supabase: <span className="text-red-600">{error?.message || 'Ninguno'}</span></p>
        <p>Registros en variable 'loans': <span className="text-green-600">{loans?.length || 0}</span></p>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Préstamos Realizados</h1>
        <Badge variant="outline">
          {loans?.length || 0} Préstamos en total
        </Badge>
      </div>
      
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto Prestado</TableHead>
              <TableHead>Saldo Pendiente</TableHead>
              <TableHead>Cuota Diaria</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans && loans.length > 0 ? (
              loans.map((loan: any) => (
                <TableRow key={loan.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium">
                    {loan.clients?.full_name || 'Sin nombre asignado'}
                  </TableCell>
                  <TableCell>{formatCOP(loan.principal_amount)}</TableCell>
                  <TableCell className="text-red-600 font-bold">
                    {formatCOP(loan.remaining_balance)}
                  </TableCell>
                  <TableCell>{formatCOP(loan.daily_payment)}</TableCell>
                  <TableCell>
                    <Badge 
                      className="capitalize"
                      variant={loan.status === 'active' ? 'default' : 'secondary'}
                    >
                      {loan.status === 'active' ? 'Cobrando' : 'Finalizado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <p>No se encontraron préstamos visibles para este usuario.</p>
                  <p className="text-xs mt-2 italic">Revisa si el user_id de la tabla coincide con el ID del recuadro gris arriba.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function LoansPage() {
  const supabase = await createClient()

  // Consulta que trae el préstamo y el nombre del cliente relacionado
  const { data: loans, error } = await supabase
    .from('loans')
    .select(`
      *,
      clients (
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error al cargar préstamos:", error.message)
  }

  // Esto te ayudará a ver en la terminal de VS Code si llegan los 39 registros
  console.log("Total de préstamos recuperados:", loans?.length)

  const formatCOP = (val: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Préstamos Realizados</h1>
        <Badge variant="outline" className="text-sm">
          {loans?.length || 0} Registros encontrados
        </Badge>
      </div>
      
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Cliente</TableHead>
              <TableHead>Monto Prestado</TableHead>
              <TableHead>Saldo Pendiente</TableHead>
              <TableHead>Cuota Diaria</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans && loans.length > 0 ? (
              loans.map((loan: any) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">
                    {/* Verificación de seguridad para el nombre del cliente */}
                    {loan.clients?.full_name || 'Cliente no vinculado'}
                  </TableCell>
                  <TableCell>{formatCOP(loan.principal_amount)}</TableCell>
                  <TableCell className="text-red-600 font-semibold">
                    {formatCOP(loan.remaining_balance)}
                  </TableCell>
                  <TableCell>{formatCOP(loan.daily_payment)}</TableCell>
                  <TableCell>
                    <Badge 
                      className="capitalize"
                      variant={loan.status === 'active' ? 'default' : 'secondary'}
                    >
                      {loan.status === 'active' ? 'Cobrando' : loan.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron préstamos. Verifica los permisos de usuario (user_id).
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

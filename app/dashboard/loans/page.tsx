import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function LoansPage() {
  const supabase = await createClient()

  // Consulta que trae el préstamo y el nombre del cliente
  const { data: loans, error } = await supabase
    .from('loans')
    .select(`
      *,
      clients (full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) console.error(error)

  const formatCOP = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Préstamos Realizados</h1>
      
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto Prestado</TableHead>
              <TableHead>Saldo Pendiente</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans?.map((loan: any) => (
              <TableRow key={loan.id}>
                <TableCell className="font-medium">{loan.clients?.full_name || 'Desconocido'}</TableCell>
                <TableCell>{formatCOP(loan.principal_amount)}</TableCell>
                <TableCell className="text-red-600">{formatCOP(loan.remaining_balance)}</TableCell>
                <TableCell>
                  <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                    {loan.status === 'active' ? 'Cobrando' : 'Finalizado'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

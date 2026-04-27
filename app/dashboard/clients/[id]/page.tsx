import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { User, Phone, MapPin, Calendar, CreditCard, History } from 'lucide-react'

export default async function ClientDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // 1. Obtener datos del cliente con sus préstamos y pagos
  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans (
        *,
        payments (*)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !client) {
    notFound()
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Detalles del Cliente</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* TARJETA DE PERFIL */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{client.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Cliente desde {new Date(client.created_at).toLocaleDateString()}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {client.phone || 'Sin teléfono'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {client.address || 'Sin dirección'}
            </div>
          </CardContent>
        </Card>

        {/* RESUMEN FINANCIERO */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Historial de Préstamos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monto</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pagos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.loans?.map((loan: any) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{formatCurrency(loan.total_amount)}</TableCell>
                    <TableCell className="text-red-600 font-bold">{formatCurrency(loan.remaining_balance)}</TableCell>
                    <TableCell>
                      <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{loan.payments?.length || 0} abonos</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* HISTORIAL DE PAGOS GLOBAL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" /> Últimos Pagos Recibidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto del Abono</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.loans?.flatMap((l: any) => l.payments || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No hay pagos registrados</TableCell>
                </TableRow>
              ) : (
                client.loans?.flatMap((l: any) => l.payments || [])
                  .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                  .map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-emerald-600 font-bold">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.notes || '-'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

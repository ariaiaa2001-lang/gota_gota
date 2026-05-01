import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  User, 
  Phone, 
  MapPin, 
  History, 
  ArrowLeft,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Verificación de sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Traer datos del cliente y sus préstamos con pagos
  // Usamos la relación que ya sabemos que funciona: remaining_balance
  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans (
        *,
        payments (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  const formatCOP = (val: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val || 0)

  const formatDate = (date: string) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('es-CO')
  }

  // Calculamos la deuda total sumando 'remaining_balance'
  const totalActiveDebt = client.loans?.reduce((acc: number, loan: any) => {
    return loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc
  }, 0) || 0

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/clients" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a Clientes
        </Link>
      </Button>

      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase">{client.full_name}</h1>
            <p className="text-xs font-mono text-muted-foreground">ID: {client.id.slice(0,8)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Saldo Pendiente Total</p>
          <p className="text-3xl font-black text-red-600">{formatCOP(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{client.phone || 'No registrado'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-sm uppercase">{client.address || 'Sin dirección'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Historial de Préstamos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Préstamos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase">Monto</TableHead>
                  <TableHead className="text-[10px] uppercase">Saldo</TableHead>
                  <TableHead className="text-[10px] uppercase">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.loans && client.loans.length > 0 ? (
                  client.loans.map((loan: any) => (
                    <TableRow key={loan.id}>
                      <TableCell className="text-sm font-medium">{formatCOP(loan.principal_amount)}</TableCell>
                      <TableCell className="text-sm font-bold text-red-600">{formatCOP(loan.remaining_balance)}</TableCell>
                      <TableCell>
                        <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold">
                          {loan.status === 'active' ? 'Vigente' : 'Pagado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground italic">
                      No hay préstamos para este cliente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Registro de Abonos */}
      <Card>
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" /> Historial de Abonos Recibidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase">Fecha</TableHead>
                <TableHead className="text-[10px] uppercase">Monto</TableHead>
                <TableHead className="text-[10px] uppercase">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.loans?.flatMap((l: any) => l.payments || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-sm text-muted-foreground italic">
                    Aún no se han registrado abonos.
                  </TableCell>
                </TableRow>
              ) : (
                client.loans?.flatMap((l: any) => l.payments || [])
                  .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{formatDate(p.created_at)}</TableCell>
                      <TableCell className="font-bold text-emerald-600 text-sm">{formatCOP(p.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.notes || '---'}</TableCell>
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

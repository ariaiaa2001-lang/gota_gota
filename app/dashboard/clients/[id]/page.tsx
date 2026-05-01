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
  CreditCard, 
  History, 
  ArrowLeft,
  Calendar
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

  // 1. Validar usuario (Tal cual lo haces en la lista de clientes)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Traer cliente (Asegurando que pertenezca al usuario)
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // <--- CRÍTICO: Filtro por usuario
    .single()

  if (clientError || !client) {
    console.error("Cliente no encontrado o error:", clientError)
    notFound()
  }

  // 3. Traer préstamos y pagos (Mismo filtro de user_id)
  // Usamos el nombre de campo 'remaining_balance' que ya confirmamos
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*, payments(*)')
    .eq('client_id', id)
    .eq('user_id', user.id) // <--- CRÍTICO: Filtro por usuario
    .order('created_at', { ascending: false })

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val || 0)

  const formatDate = (date: string) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  // Calculamos la deuda pendiente sumando 'remaining_balance'
  const totalActiveDebt = loans?.reduce((acc: number, loan: any) => {
    return loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc
  }, 0) || 0

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/clients" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a Clientes
        </Link>
      </Button>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase">{client.full_name}</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">ID: {client.id.slice(0,8)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Deuda Total Pendiente</p>
          <p className="text-3xl font-black text-red-600">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{client.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-sm uppercase">{client.address || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] text-muted-foreground">Registro: {formatDate(client.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabla Préstamos */}
        <Card className="md:col-span-2">
          <CardHeader className="bg-slate-50/30 border-b">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Préstamos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase">F. Inicio</TableHead>
                  <TableHead className="text-[10px] uppercase">Monto</TableHead>
                  <TableHead className="text-[10px] uppercase">Saldo Actual</TableHead>
                  <TableHead className="text-[10px] uppercase">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans && loans.length > 0 ? (
                  loans.map((loan: any) => (
                    <TableRow key={loan.id}>
                      <TableCell className="text-[11px]">{formatDate(loan.created_at)}</TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(loan.principal_amount || loan.total_amount)}</TableCell>
                      <TableCell className="text-sm font-black text-red-600">{formatCurrency(loan.remaining_balance)}</TableCell>
                      <TableCell>
                        <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold">
                          {loan.status === 'active' ? 'Vigente' : 'Pagado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-xs">
                      No se encontraron préstamos para este cliente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Abonos */}
      <Card>
        <CardHeader className="bg-slate-50/30 border-b">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" /> Registro de Abonos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase">Fecha Pago</TableHead>
                <TableHead className="text-[10px] uppercase">Monto</TableHead>
                <TableHead className="text-[10px] uppercase">Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loans?.flatMap(l => l.payments || []).length ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic text-xs">
                    Sin abonos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                loans.flatMap(l => l.payments || [])
                  .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-[11px]">{formatDate(p.created_at)}</TableCell>
                      <TableCell className="text-sm font-black text-emerald-600">{formatCurrency(p.amount)}</TableCell>
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

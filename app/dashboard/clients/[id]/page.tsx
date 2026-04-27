import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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
  TrendingDown,
  DollarSign,
  Calendar
} from 'lucide-react'

export default async function ClientDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // 1. Obtener datos del cliente con sus préstamos y pagos vinculados
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

  // Si hay error o no existe el cliente, mandamos a página 404
  if (error || !client) {
    notFound()
  }

  // 2. Normalización y Cálculos
  const displayName = client.full_name || client.name || "Sin nombre"
  
  const totalDebt = client.loans?.reduce((acc: number, loan: any) => {
    return loan.status === 'active' ? acc + Number(loan.remaining_balance) : acc
  }, 0) || 0

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val)

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

  // Extraer todos los pagos de todos los préstamos para la tabla global
  const allPayments = client.loans?.flatMap((l: any) => 
    (l.payments || []).map((p: any) => ({ ...p, loan_amount: l.total_amount }))
  ).sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()) || []

  return (
    <div className="p-6 space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Perfil del Cliente</h1>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" /> Registrado el {formatDate(client.created_at)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* TARJETA DE PERFIL (1 col) */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader className="flex flex-col items-center border-b bg-slate-50/50 pb-6">
            <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
              <User className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-center text-xl">{displayName}</CardTitle>
            <Badge variant="outline" className="mt-2 uppercase tracking-widest text-[10px]">
              ID: {client.id.slice(0, 8)}
            </Badge>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="p-2 bg-slate-100 rounded-md"><Phone className="h-4 w-4" /></div>
              <span className="font-medium">{client.phone || 'No registra teléfono'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="p-2 bg-slate-100 rounded-md"><MapPin className="h-4 w-4" /></div>
              <span className="font-medium">{client.address || 'No registra dirección'}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Deuda Total Activa</p>
                <p className="text-2xl font-black text-red-700">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HISTORIAL DE PRÉSTAMOS (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                <CreditCard className="h-5 w-5 text-blue-600" /> Préstamos Vinculados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Abonos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.loans?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                        Este cliente no tiene préstamos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    client.loans?.map((loan: any) => (
                      <TableRow key={loan.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-xs font-medium">{formatDate(loan.start_date)}</TableCell>
                        <TableCell className="font-bold text-slate-700">{formatCurrency(loan.total_amount)}</TableCell>
                        <TableCell>
                          <span className={loan.remaining_balance > 0 ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                            {formatCurrency(loan.remaining_balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {loan.status === 'active' ? 'Activo' : 'Finalizado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {loan.payments?.length || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ÚLTIMOS MOVIMIENTOS */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                <History className="h-5 w-5 text-emerald-600" /> Historial de Abonos Recibidos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead>Monto Abonado</TableHead>
                    <TableHead>Préstamo</TableHead>
                    <TableHead>Nota / Comentario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                        No se han registrado abonos todavía.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allPayments.map((p: any) => (
                      <TableRow key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                        <TableCell className="text-xs">{formatDate(p.payment_date)}</TableCell>
                        <TableCell className="text-emerald-700 font-black">
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            {formatCurrency(p.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-400 uppercase">
                          Ref: {formatCurrency(p.loan_amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate italic text-slate-500 text-xs">
                          {p.notes || '---'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, MapPin, CreditCard, History, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ClientDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()

  // 🔐 Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 👤 Obtener cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientError || !client) {
    console.error(clientError)
    notFound()
  }

  // 💰 Obtener préstamos (CORREGIDO)
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .eq('client_id', id)

  if (loansError) {
    console.error(loansError)
  }

  // 💳 Obtener pagos
  let allPayments: any[] = []

  if (loans && loans.length > 0) {
    const loanIds = loans.map(l => l.id)

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .in('loan_id', loanIds)

    if (paymentsError) {
      console.error(paymentsError)
    }

    allPayments = payments || []
  }

  // 💲 Formato moneda
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0)

  // 📅 Formato fecha
  const formatDate = (date: string) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // 📊 Total deuda activa
  const totalActiveDebt =
    loans?.reduce((acc, loan) =>
      loan.status === 'active'
        ? acc + (Number(loan.remaining_balance) || 0)
        : acc
    , 0) || 0

  return (
    <div className="p-6 space-y-6">
      {/* BOTÓN VOLVER */}
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/clients" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      </Button>

      {/* HEADER CLIENTE */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black">
            {client.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase">{client.full_name}</h1>
            <Badge variant="outline" className="text-[10px]">{id}</Badge>
          </div>
        </div>

        <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-right">
          <p className="text-xs uppercase">Saldo Pendiente</p>
          <p className="text-4xl font-black text-emerald-400">
            {formatCurrency(totalActiveDebt)}
          </p>
        </div>
      </div>

      {/* INFO + PRÉSTAMOS */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* CONTACTO */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5" />
              {client.phone || 'Sin número'}
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />
              {client.address || 'Sin dirección'}
            </div>
          </CardContent>
        </Card>

        {/* PRÉSTAMOS */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Préstamos
            </CardTitle>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loans && loans.length > 0 ? (
                loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{formatDate(loan.created_at)}</TableCell>
                    <TableCell>{formatCurrency(loan.total_amount)}</TableCell>
                    <TableCell>{formatCurrency(loan.remaining_balance)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={loan.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}>
                        {loan.status === 'active' ? 'Vigente' : 'Pagado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400">
                    Sin préstamos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* PAGOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Pagos
          </CardTitle>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {allPayments.length > 0 ? (
              allPayments
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.created_at)}</TableCell>
                    <TableCell className="text-green-600 font-bold">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>{p.notes || 'Pago de cuota'}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-400">
                  Sin pagos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

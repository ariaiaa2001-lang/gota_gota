import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { User, Phone, MapPin, CreditCard, History, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Verificación de sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Traer al Cliente (Saul Soto)
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // 3. CONSULTA DE FUERZA BRUTA PARA PRÉSTAMOS
  // Buscamos ignorando mayúsculas/minúsculas y forzando el string del ID
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .or(`Client_id.eq.${id},client_id.eq.${id}`)

  // 4. CONSULTA MANUAL DE PAGOS (Sin depender de la relación anidada)
  // Si hay préstamos, buscamos sus pagos uno por uno
  let allPayments: any[] = []
  if (loans && loans.length > 0) {
    const loanIds = loans.map(l => l.id)
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .in('loan_id', loanIds)
    allPayments = payments || []
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)

  const formatDate = (date: string) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const totalActiveDebt = loans?.reduce((acc, loan) => 
    loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc, 0) || 0

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/clients" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      </Button>

      {/* BANNER PRINCIPAL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-200">
            {client.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{client.full_name}</h1>
            <Badge variant="outline" className="font-mono text-[10px] opacity-50">{id}</Badge>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
          <p className="text-4xl font-black text-emerald-400">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* INFO CONTACTO */}
        <Card className="border-2 border-slate-100">
          <CardHeader><CardTitle className="text-xs font-black uppercase text-slate-400">Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Phone className="h-5 w-5 text-indigo-500" />
              <span className="font-bold text-slate-700">{client.phone || 'Sin número'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <MapPin className="h-5 w-5 text-rose-500" />
              <span className="font-bold text-slate-700 uppercase">{client.address || 'Sin dirección'}</span>
            </div>
          </CardContent>
        </Card>

        {/* TABLA CRÉDITOS */}
        <Card className="md:col-span-2 border-2 border-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b-2 border-slate-100">
            <CardTitle className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Préstamos Activos e Históricos
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase">Fecha</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Monto Inicial</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Saldo Hoy</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans && loans.length > 0 ? (
                loans.map((loan) => (
                  <TableRow key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-600">{formatDate(loan.created_at)}</TableCell>
                    <TableCell className="font-bold text-slate-900">{formatCurrency(loan.total_amount)}</TableCell>
                    <TableCell className="font-black text-rose-600">{formatCurrency(loan.remaining_balance)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={`uppercase text-[9px] font-black ${loan.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                        {loan.status === 'active' ? 'Vigente' : 'Pagado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-slate-400 italic text-sm">
                    No se detectaron préstamos vinculados a este ID.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* TABLA ABONOS */}
      <Card className="border-2 border-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b-2 border-slate-100">
          <CardTitle className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
            <History className="h-4 w-4" /> Registro de Pagos Recibidos
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase">Fecha de Abono</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Valor</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPayments.length > 0 ? (
              allPayments
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-bold text-slate-500">{formatDate(p.created_at)}</TableCell>
                    <TableCell className="font-black text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-xs text-slate-400 uppercase italic">{p.notes || 'Pago de cuota'}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-slate-400 italic text-sm">
                  Sin registros de abonos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

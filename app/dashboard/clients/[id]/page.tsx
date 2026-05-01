import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, MapPin, CreditCard, History, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Importamos los modales del archivo que creaste
import { 
  PaymentModal, 
  EditPaymentModal, 
  DeletePaymentModal, 
  EditClientModal 
} from './client-modals'

// Importamos las acciones
import { 
  updateClient, 
  createPayment, 
  updatePayment, 
  deletePayment 
} from '@/lib/actions/client-actions'

export const dynamic = 'force-dynamic'

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) return <div className="p-6 text-center font-bold">Cliente no encontrado</div>

  const { data: loans } = await supabase.from('loans').select('*').eq('client_id', id).order('created_at', { ascending: false })

  let allPayments: any[] = []
  if (loans && loans.length > 0) {
    const loanIds = loans.map((l) => l.id)
    const { data: payments } = await supabase.from('payments').select('*').in('loan_id', loanIds)
    allPayments = payments || []
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)

  const formatDate = (date: string) => {
    if (!date) return '---'
    try {
      return new Date(date).toLocaleDateString('es-CO', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      })
    } catch (e) { return 'Fecha inválida' }
  }

  const totalActiveDebt = loans?.reduce((acc, loan) => 
    loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc, 0) || 0

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen">
      
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-indigo-600 transition-colors">
          <Link href="/dashboard/clients" className="flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Volver a la lista
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-100">
            {client.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold tracking-tight text-slate-800 uppercase">{client.full_name}</h1>
               <EditClientModal client={client} updateClientAction={updateClient} />
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">{id}</p>
          </div>
        </div>
        
        <div className="bg-white px-8 py-5 rounded-xl border border-emerald-100 text-right shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-widest">Deuda Total Pendiente</p>
          <p className="text-4xl font-black text-emerald-600 tabular-nums">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm border-2">
          <CardHeader><CardTitle className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Datos de Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Phone className="h-5 w-5 text-indigo-500" />
              <span className="font-bold text-slate-700">{client.phone || 'Sin número'}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 uppercase text-[11px]">
              <MapPin className="h-5 w-5 text-rose-400" />
              <span className="font-bold text-slate-700 leading-tight">{client.address || 'Cobrador'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-slate-200 shadow-sm border-2 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] uppercase text-slate-500 flex items-center gap-2 font-black tracking-widest">
              <CreditCard className="h-4 w-4 text-indigo-400" /> Historial de Créditos
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-transparent">
                <TableHead className="font-bold text-[11px] text-slate-400">Fecha</TableHead>
                <TableHead className="font-bold text-[11px] text-slate-400">Monto</TableHead>
                <TableHead className="font-bold text-[11px] text-slate-400">Saldo Actual</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans?.map((loan) => (
                <TableRow key={loan.id} className="border-b border-slate-50">
                  <TableCell className="text-[11px] text-slate-400 font-medium">{formatDate(loan.created_at)}</TableCell>
                  <TableCell className="font-bold text-slate-700">{formatCurrency(loan.total_amount)}</TableCell>
                  <TableCell>
                    <span className={`font-black text-lg ${loan.remaining_balance <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(loan.remaining_balance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <PaymentModal loanId={loan.id} clientId={client.id} createPaymentAction={createPayment} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm border-2 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <CardTitle className="text-[10px] uppercase text-slate-500 flex items-center gap-2 font-black tracking-widest">
            <History className="h-4 w-4 text-emerald-500" /> Registro Detallado de Abonos
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-transparent">
              <TableHead className="text-[11px] font-bold text-slate-500">Fecha y Hora</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Monto</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Detalles</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-slate-500">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                <TableCell className="text-[10px] font-semibold text-slate-400">{formatDate(p.created_at)}</TableCell>
                <TableCell className="text-emerald-600 font-black text-xl">{formatCurrency(p.amount)}</TableCell>
                <TableCell className="text-[11px] text-slate-500 font-medium uppercase italic">{p.notes || '---'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <EditPaymentModal payment={p} clientId={client.id} updatePaymentAction={updatePayment} />
                    <DeletePaymentModal payment={p} clientId={client.id} deletePaymentAction={deletePayment} formatCurrency={formatCurrency} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

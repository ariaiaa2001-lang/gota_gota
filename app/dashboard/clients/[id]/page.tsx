import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, MapPin, CreditCard, History, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// 1. IMPORTANTE: Importamos tu nuevo componente de cliente
import { PaymentForm } from '@/components/PaymentForm'

import { updateClient, updatePayment, deletePayment } from '@/lib/actions/client-actions'

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
    return new Date(date).toLocaleDateString('es-CO', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    })
  }

  const totalActiveDebt = loans?.reduce((acc, loan) => 
    loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc, 0) || 0

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen">
      
      {/* NAVEGACIÓN */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-indigo-600 transition-colors">
          <Link href="/dashboard/clients" className="flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Volver a la lista
          </Link>
        </Button>
      </div>

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-100">
            {client.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold tracking-tight text-slate-800 uppercase">{client.full_name}</h1>
               <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Editar Datos del Cliente</DialogTitle></DialogHeader>
                  <form action={async (formData) => { "use server"; await updateClient(client.id, formData); }} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Nombre Completo</Label>
                      <Input name="full_name" defaultValue={client.full_name} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input name="phone" defaultValue={client.phone} />
                    </div>
                    <div className="space-y-2">
                      <Label>Cobrador / Dirección</Label>
                      <Input name="address" defaultValue={client.address} />
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600">Actualizar Cliente</Button>
                  </form>
                </DialogContent>
              </Dialog>
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
        {/* CARD IZQUIERDA: CONTACTO */}
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

        {/* CARD DERECHA: PRÉSTAMOS */}
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
                    {/* 2. AQUÍ USAMOS TU COMPONENTE PaymentForm */}
                    <PaymentForm loanId={loan.id} clientId={client.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* SECCIÓN INFERIOR: HISTORIAL DE ABONOS */}
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
                <TableCell className="text-[10px] font-semibold text-slate-400">
                  {formatDate(p.created_at)}
                </TableCell>
                <TableCell className="text-emerald-600 font-black text-xl">
                  {formatCurrency(p.amount)}
                </TableCell>
                <TableCell className="text-[11px] text-slate-500 font-medium uppercase italic">
                  {p.notes || '---'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* EDITAR */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Corregir Abono</DialogTitle></DialogHeader>
                        <form action={async (formData) => { "use server"; await updatePayment(p.id, client.id, formData); }} className="space-y-4 pt-4">
                          <div className="space-y-1">
                            <Label>Monto Correcto</Label>
                            <Input name="amount" type="number" defaultValue={p.amount} required className="text-xl font-bold" />
                          </div>
                          <div className="space-y-1">
                            <Label>Fecha Real</Label>
                            <Input name="date" type="datetime-local" defaultValue={new Date(p.created_at).toISOString().slice(0, 16)} required />
                          </div>
                          <div className="space-y-1">
                            <Label>Nota</Label>
                            <Textarea name="notes" defaultValue={p.notes} />
                          </div>
                          <Button type="submit" className="w-full bg-blue-600">Actualizar</Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {/* ELIMINAR */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-rose-600">¿Eliminar registro?</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-sm text-slate-600">
                          Vas a eliminar el abono de <span className="font-bold text-slate-900">{formatCurrency(p.amount)}</span>. 
                          Esta acción es permanente y afectará el saldo total del cliente.
                        </div>
                        <DialogFooter>
                          <form action={async () => { "use server"; await deletePayment(p.id, client.id); }} className="w-full">
                            <Button type="submit" variant="destructive" className="w-full bg-rose-600 hover:bg-rose-700 font-bold">SÍ, ELIMINAR AHORA</Button>
                          </form>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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

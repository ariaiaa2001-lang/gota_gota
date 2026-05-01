import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, MapPin, CreditCard, History, ArrowLeft, Pencil, PlusCircle, Trash2 } from 'lucide-react'
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

import { updateClient, createPayment, updatePayment, deletePayment } from '@/lib/actions/client-actions'

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC]">
      
      {/* NAVEGACIÓN */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-indigo-600">
          <Link href="/dashboard/clients" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver a Clientes
          </Link>
        </Button>
      </div>

      {/* HEADER TEMA CLARO - ESTILO PROFESIONAL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-100">
            {client.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold tracking-tight text-slate-800">{client.full_name}</h1>
               <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
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
                      <Label>Cobrador / Zona</Label>
                      <Input name="address" defaultValue={client.address} />
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600">Guardar Cambios</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">{id}</p>
          </div>
        </div>
        
        {/* CARD DE DEUDA CLARA */}
        <div className="bg-white px-8 py-4 rounded-xl border border-emerald-100 text-right min-w-[240px]">
          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Deuda Total Pendiente</p>
          <p className="text-3xl font-black text-emerald-500 tabular-nums">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* INFO CONTACTO */}
        <Card className="border-slate-100 shadow-sm border-2">
          <CardHeader><CardTitle className="text-[10px] uppercase text-slate-400 font-black tracking-tighter">Datos de Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
              <Phone className="h-4 w-4 text-indigo-500" />
              <span className="font-bold text-slate-600">{client.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg uppercase text-[10px]">
              <MapPin className="h-4 w-4 text-rose-400" />
              <span className="font-bold text-slate-600">{client.address || 'Cobrador'}</span>
            </div>
          </CardContent>
        </Card>

        {/* PRÉSTAMOS */}
        <Card className="md:col-span-2 border-slate-100 shadow-sm border-2 overflow-hidden">
          <CardHeader className="bg-slate-50/30 border-b border-slate-50">
            <CardTitle className="text-[10px] uppercase text-slate-400 flex items-center gap-2 font-black">
              <CreditCard className="h-4 w-4 text-indigo-400" /> Historial de Préstamos
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold text-[11px] text-slate-400">Fecha</TableHead>
                <TableHead className="font-bold text-[11px] text-slate-400">Monto</TableHead>
                <TableHead className="font-bold text-[11px] text-slate-400">Saldo</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans?.map((loan) => (
                <TableRow key={loan.id} className="border-b border-slate-50">
                  <TableCell className="text-[11px] text-slate-400">{formatDate(loan.created_at)}</TableCell>
                  <TableCell className="font-bold text-slate-600">{formatCurrency(loan.total_amount)}</TableCell>
                  <TableCell>
                    <span className={`font-black ${loan.remaining_balance <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(loan.remaining_balance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-indigo-100 text-indigo-600 font-bold text-[10px] h-7 px-3 hover:bg-indigo-600 hover:text-white rounded-md">
                          + ABONAR
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
                        <form action={async (formData) => { "use server"; await createPayment(loan.id, client.id, formData); }} className="space-y-4 pt-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Cantidad</Label>
                            <Input name="amount" type="number" required className="text-2xl font-black h-14" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Fecha del Recibo</Label>
                            <Input name="date" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Notas</Label>
                            <Textarea name="notes" placeholder="Ej. Pago cuota semanal" />
                          </div>
                          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold">GUARDAR ABONO</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* REGISTRO DE ABONOS - LIMPIO SIN NEGROS */}
      <Card className="border-slate-100 shadow-sm border-2 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-50">
          <CardTitle className="text-[10px] uppercase text-slate-400 flex items-center gap-2 font-black">
            <History className="h-4 w-4 text-emerald-400" /> Registro General de Abonos
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-transparent">
              <TableHead className="text-[11px] font-bold text-slate-400">Fecha de Pago</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400">Monto Recibido</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400">Notas / Detalle</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-slate-400">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/30 border-slate-50 group">
                <TableCell className="text-[10px] font-medium text-slate-400 italic">
                  {formatDate(p.created_at)}
                </TableCell>
                <TableCell className="text-emerald-500 font-black text-lg">
                  {formatCurrency(p.amount)}
                </TableCell>
                <TableCell className="text-[11px] text-slate-500 font-medium uppercase">
                  {p.notes || '---'}
                </TableCell>
                <TableCell className="text-right space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* EDITAR */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-indigo-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar Abono</DialogTitle></DialogHeader>
                      <form action={async (formData) => { "use server"; await updatePayment(p.id, client.id, formData); }} className="space-y-4 pt-4">
                        <div className="space-y-1">
                          <Label>Monto</Label>
                          <Input name="amount" type="number" defaultValue={p.amount} required />
                        </div>
                        <div className="space-y-1">
                          <Label>Fecha</Label>
                          <Input name="date" type="datetime-local" defaultValue={new Date(p.created_at).toISOString().slice(0, 16)} required />
                        </div>
                        <div className="space-y-1">
                          <Label>Nota</Label>
                          <Textarea name="notes" defaultValue={p.notes} />
                        </div>
                        <Button type="submit" className="w-full bg-slate-800">Actualizar</Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* ELIMINAR */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="text-rose-600">¿Eliminar abono?</DialogTitle></DialogHeader>
                      <div className="py-4 text-sm text-slate-500">
                        ¿Estás seguro de que quieres borrar este abono de <span className="font-bold text-slate-800">{formatCurrency(p.amount)}</span>? Esta acción no se puede deshacer.
                      </div>
                      <DialogFooter>
                        <form action={async () => { "use server"; await deletePayment(p.id, client.id); }}>
                          <Button type="submit" variant="destructive" className="w-full bg-rose-600 font-bold">SÍ, ELIMINAR</Button>
                        </form>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

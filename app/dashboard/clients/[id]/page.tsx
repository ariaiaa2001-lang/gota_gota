import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, MapPin, CreditCard, History, ArrowLeft, Pencil, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Componentes UI de Shadcn
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Acciones de servidor
import { updateClient, createPayment, updatePayment } from '@/lib/actions/client-actions'

export const dynamic = 'force-dynamic'

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 🔐 Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 👤 Obtener datos del cliente
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) return <div className="p-6 text-center font-bold">❌ Cliente no encontrado</div>

  // 💰 Obtener préstamos
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  // 💳 Obtener todos los pagos de esos préstamos
  let allPayments: any[] = []
  if (loans && loans.length > 0) {
    const loanIds = loans.map((l) => l.id)
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .in('loan_id', loanIds)
    allPayments = payments || []
  }

  // 💲 Formateadores
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)

  const formatDate = (date: string) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('es-CO', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    })
  }

  // Saldo total activo
  const totalActiveDebt = loans?.reduce((acc, loan) => 
    loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc, 0) || 0

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* BARRA SUPERIOR: VOLVER Y EDITAR CLIENTE */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/clients" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver a la lista
          </Link>
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-indigo-200 hover:bg-indigo-50">
              <Pencil className="h-4 w-4 text-indigo-600" /> Editar Perfil
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Información del Cliente</DialogTitle></DialogHeader>
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
                <Label>Dirección / Cobrador</Label>
                <Input name="address" defaultValue={client.address} />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Guardar Cambios</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* HEADER DE IMPACTO */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black">
            {client.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800">{client.full_name}</h1>
            <Badge variant="secondary" className="font-mono text-[10px] opacity-50 mt-1">{id}</Badge>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-10 py-6 rounded-2xl text-right border-r-8 border-emerald-500 shadow-xl">
          <p className="text-xs uppercase text-slate-400 font-bold mb-1">Deuda Total Actual</p>
          <p className="text-4xl font-black text-emerald-400 tabular-nums">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* INFO CARD */}
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-xs uppercase text-slate-400">Datos de Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Phone className="h-5 w-5 text-indigo-500" />
              <span className="font-semibold text-slate-700">{client.phone || 'Sin teléfono'}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 uppercase text-xs">
              <MapPin className="h-5 w-5 text-rose-500" />
              <span className="font-semibold text-slate-700">{client.address || 'Sin dirección'}</span>
            </div>
          </CardContent>
        </Card>

        {/* PRÉSTAMOS CARD */}
        <Card className="md:col-span-2 border shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xs uppercase text-slate-500 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Historial de Préstamos
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans?.map((loan) => (
                <TableRow key={loan.id} className="group">
                  <TableCell className="text-xs text-slate-500">{formatDate(loan.created_at)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(loan.total_amount)}</TableCell>
                  <TableCell>
                    <span className={`font-black ${loan.remaining_balance <= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                      {formatCurrency(loan.remaining_balance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-[10px] font-bold uppercase hover:bg-emerald-50 hover:text-emerald-700 border-emerald-100">
                          <PlusCircle className="h-3 w-3" /> Abonar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Registrar Nuevo Pago</DialogTitle></DialogHeader>
                        <form action={async (formData) => { "use server"; await createPayment(loan.id, client.id, formData); }} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Valor del Pago</Label>
                            <Input name="amount" type="number" placeholder="0" required className="text-xl font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label>Fecha del Pago (Manual)</Label>
                            <Input name="date" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Comentarios</Label>
                            <Textarea name="notes" placeholder="Ej: Pago cuota semana 2" />
                          </div>
                          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Registrar Abono</Button>
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

      {/* HISTORIAL DE ABONOS (EDITABLE) */}
      <Card className="border shadow-lg">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <CardTitle className="text-sm uppercase flex items-center gap-2 font-bold">
            <History className="h-4 w-4 text-emerald-400" /> Registro General de Abonos
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[200px]">Fecha de Pago</TableHead>
              <TableHead>Monto Recibido</TableHead>
              <TableHead>Notas / Detalle</TableHead>
              <TableHead className="text-right">Ajustes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPayments.length > 0 ? (
              allPayments
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-xs font-medium text-slate-500">
                      {formatDate(p.created_at)}
                    </TableCell>
                    <TableCell className="text-emerald-600 font-black text-lg">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 uppercase italic">
                      {p.notes || '---'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Corregir Registro de Pago</DialogTitle></DialogHeader>
                          <form action={async (formData) => { "use server"; await updatePayment(p.id, client.id, formData); }} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Monto Correcto</Label>
                              <Input name="amount" type="number" defaultValue={p.amount} required className="text-lg font-bold text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                              <Label>Fecha Real del Pago</Label>
                              <Input name="date" type="datetime-local" defaultValue={new Date(p.created_at).toISOString().slice(0, 16)} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Nota de Corrección</Label>
                              <Textarea name="notes" defaultValue={p.notes} />
                            </div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-black">Actualizar Pago</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-400 italic">No hay abonos en el sistema.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

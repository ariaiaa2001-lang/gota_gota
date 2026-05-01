import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, MapPin, CreditCard, History, ArrowLeft, Pencil, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Componentes de UI para formularios
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

// IMPORTA TUS ACCIONES AQUÍ
import { updateClient, createPayment } from '@/lib/actions/client-actions'

export const dynamic = 'force-dynamic'

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 👤 Obtener cliente
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) return <div className="p-6">❌ Cliente no encontrado</div>

  // 💰 Obtener préstamos
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('client_id', id)

  // 💳 Obtener pagos
  let allPayments: any[] = []
  if (loans && loans.length > 0) {
    const loanIds = loans.map((l) => l.id)
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .in('loan_id', loanIds)
    allPayments = payments || []
  }

  // 💲 Helpers
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
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/clients" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>

        {/* MODAL EDITAR CLIENTE */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" /> Editar Datos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar información del cliente</DialogTitle>
            </DialogHeader>
            <form action={async (formData) => {
              "use server"
              await updateClient(client.id, formData)
            }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input name="full_name" defaultValue={client.full_name} required />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input name="phone" defaultValue={client.phone} />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input name="address" defaultValue={client.address} />
              </div>
              <Button type="submit" className="w-full">Guardar Cambios</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* HEADER CLIENTE */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black uppercase">
            {client.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{client.full_name}</h1>
            <Badge variant="outline" className="font-mono text-[10px] opacity-60">{id}</Badge>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-right border-b-4 border-emerald-500">
          <p className="text-xs uppercase text-slate-400 font-bold">Deuda Actual</p>
          <p className="text-4xl font-black text-emerald-400">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2">
          <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Información</CardTitle></CardHeader>
          <CardContent className="space-y-4 font-medium text-slate-700">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg"><Phone className="h-4 w-4 text-indigo-600" /> {client.phone || 'N/A'}</div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg uppercase text-xs"><MapPin className="h-4 w-4 text-rose-600" /> {client.address || 'N/A'}</div>
          </CardContent>
        </Card>

        {/* TABLA PRÉSTAMOS CON OPCIÓN DE ABONAR */}
        <Card className="md:col-span-2 border-2 overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-sm uppercase text-slate-500 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Historial de Préstamos</CardTitle>
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
                <TableRow key={loan.id}>
                  <TableCell className="text-xs">{formatDate(loan.created_at)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(loan.total_amount)}</TableCell>
                  <TableCell className="font-bold text-rose-600">{formatCurrency(loan.remaining_balance)}</TableCell>
                  <TableCell className="text-right">
                    {/* MODAL REGISTRAR ABONO */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="xs" variant="outline" className="h-8 gap-1 text-[10px] font-bold uppercase">
                          <PlusCircle className="h-3 w-3" /> Abonar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Pago - {formatCurrency(loan.total_amount)}</DialogTitle>
                        </DialogHeader>
                        <form action={async (formData) => {
                          "use server"
                          await createPayment(loan.id, client.id, formData)
                        }} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Monto del Abono</Label>
                            <Input name="amount" type="number" placeholder="Ej: 50000" required />
                          </div>
                          <div className="space-y-2">
                            <Label>Fecha del Pago (Manual)</Label>
                            <Input name="date" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Notas / Observaciones</Label>
                            <Textarea name="notes" placeholder="Ej: Pago adelantado" />
                          </div>
                          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Confirmar Pago</Button>
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

      {/* HISTORIAL DE ABONOS */}
      <Card className="border-2">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-sm uppercase text-slate-500 flex items-center gap-2"><History className="h-4 w-4" /> Registro General de Abonos</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha de Pago</TableHead>
              <TableHead>Monto Recibido</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-medium text-slate-500">{formatDate(p.created_at)}</TableCell>
                <TableCell className="text-emerald-600 font-black">{formatCurrency(p.amount)}</TableCell>
                <TableCell className="text-xs text-slate-400 uppercase italic">{p.notes || '---'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

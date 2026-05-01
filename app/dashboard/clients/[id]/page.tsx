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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Obtener datos del cliente
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // 2. Obtener préstamos usando "Client_id" (con C mayúscula como en tu imagen)
  // Y traemos los pagos asociados
  const { data: loans } = await supabase
    .from('loans')
    .select('*, payments(*)')
    .eq('Client_id', id) // Corregido a C mayúscula
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

  const totalActiveDebt = loans?.reduce((acc, loan) => {
    return loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc
  }, 0) || 0

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/clients" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a Clientes
        </Link>
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
            {client.full_name?.charAt(0) || <User />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase">{client.full_name}</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">ID: {client.id.slice(0,12)}...</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Deuda Actual</p>
          <p className="text-3xl font-black text-red-600">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-xs font-bold uppercase text-muted-foreground">Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-blue-500" /> {client.phone || 'N/A'}</div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-red-500" /> <span className="uppercase">{client.address || 'N/A'}</span></div>
            <div className="pt-2 border-t flex items-center gap-3 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" /> Registrado: {formatDate(client.created_at)}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Historial de Créditos</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase">Fecha</TableHead>
                <TableHead className="text-[10px] uppercase">Monto</TableHead>
                <TableHead className="text-[10px] uppercase">Saldo</TableHead>
                <TableHead className="text-[10px] uppercase">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans && loans.length > 0 ? loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="text-xs">{formatDate(loan.created_at)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(loan.total_amount)}</TableCell>
                  <TableCell className="text-sm font-bold text-red-600">{formatCurrency(loan.remaining_balance)}</TableCell>
                  <TableCell>
                    <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                      {loan.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic text-sm">No hay préstamos.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" /> Registro de Abonos
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase">Fecha</TableHead>
              <TableHead className="text-[10px] uppercase">Monto</TableHead>
              <TableHead className="text-[10px] uppercase">Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans?.flatMap(l => l.payments || []).length ? 
              loans.flatMap(l => l.payments || [])
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{formatDate(p.created_at)}</TableCell>
                    <TableCell className="text-sm font-bold text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground uppercase">{p.notes || 'Abono de cuota'}</TableCell>
                  </TableRow>
                )) : 
              <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic text-sm">No hay abonos registrados.</TableCell></TableRow>
            }
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

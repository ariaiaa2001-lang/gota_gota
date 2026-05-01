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
import { User, Phone, MapPin, CreditCard, History, ArrowLeft, Calendar } from 'lucide-react'
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

  // 2. CONSULTA DE SEGURIDAD: 
  // Intentamos traer los préstamos usando el nombre exacto de la columna con comillas
  // para evitar que el driver de Supabase la pase a minúsculas.
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*, payments(*)')
    .or(`Client_id.eq.${id},client_id.eq.${id}`) // Buscamos en ambas versiones por si acaso
    .order('created_at', { ascending: false })

  // Formateadores
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)

  const formatDate = (date: string) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Cálculo de deuda (Usando los nombres de columna de tu imagen image_74a86b.jpg)
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

      {/* Perfil */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-black border-2 border-blue-100">
            {client.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{client.full_name}</h1>
            <p className="text-[10px] font-mono text-muted-foreground">ID: {id}</p>
          </div>
        </div>
        <div className="bg-red-50 px-6 py-3 rounded-lg border border-red-100 text-right">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Deuda Actual</p>
          <p className="text-3xl font-black text-red-600">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contacto */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-xs font-bold uppercase text-muted-foreground">Datos de Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-blue-50 rounded-full"><Phone className="h-4 w-4 text-blue-500" /></div>
              <span className="font-medium text-slate-700">{client.phone || 'No registrado'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-red-50 rounded-full"><MapPin className="h-4 w-4 text-red-500" /></div>
              <span className="font-medium text-slate-700 uppercase">{client.address || 'Sin dirección'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Créditos */}
        <Card className="md:col-span-2 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Historial de Créditos
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30">
                  <TableHead className="text-[10px] font-bold uppercase">Fecha</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Préstamo</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Saldo</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans && loans.length > 0 ? (
                  loans.map((loan) => (
                    <TableRow key={loan.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-xs font-medium">{formatDate(loan.created_at)}</TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900">{formatCurrency(loan.total_amount)}</TableCell>
                      <TableCell className="text-sm font-black text-red-600">{formatCurrency(loan.remaining_balance)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="text-[9px] uppercase font-black px-2">
                          {loan.status === 'active' ? 'Vigente' : 'Pagado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-sm">
                      No hay préstamos registrados para este cliente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Abonos */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" /> Registro General de Abonos
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/30">
              <TableHead className="text-[10px] font-bold uppercase">Fecha de Pago</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-center">Monto Recibido</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Notas / Observaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans?.flatMap(l => l.payments || []).length ? (
              loans.flatMap(l => l.payments || [])
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-medium">{formatDate(p.created_at)}</TableCell>
                    <TableCell className="text-center font-black text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground italic uppercase">{p.notes || 'Abono realizado'}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic text-sm">
                  El cliente no registra abonos todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

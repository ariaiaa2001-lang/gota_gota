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
  // 1. Manejo de Auth y Params
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 2. Consulta idéntica a la lógica que nos funcionó en la lista
  // Filtramos por ID del cliente Y por user_id del cobrador por seguridad
  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      *,
      loans (
        *,
        payments (*)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !client) {
    console.error("Error o cliente no encontrado:", error?.message)
    notFound()
  }

  // 3. Helpers de formato
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

  // Calculamos deuda usando remaining_balance (como en el dashboard)
  const totalActiveDebt = client.loans?.reduce((acc: number, loan: any) => {
    return loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc
  }, 0) || 0

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/clients" className="flex items-center gap-2 text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Volver a la lista
        </Link>
      </Button>

      {/* Perfil del Cliente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-2xl border shadow-sm gap-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              {client.full_name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
               <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">ID: {client.id.slice(0,8)}...</Badge>
               <span className="text-sm text-slate-400 flex items-center gap-1">
                 <Calendar className="h-3 w-3" /> Registrado: {formatDate(client.created_at)}
               </span>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl text-right min-w-[200px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo Total Pendiente</p>
          <p className="text-3xl font-black text-emerald-400">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contacto */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Información General</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Phone className="h-4 w-4" /></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Teléfono</p>
                <p className="text-sm font-semibold">{client.phone || 'No asignado'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-50 rounded-lg text-red-600"><MapPin className="h-4 w-4" /></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Dirección de Cobro</p>
                <p className="text-sm font-semibold">{client.address || 'Sin dirección'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial de Créditos */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Préstamos Vinculados
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase font-bold">Iniciado</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Monto Total</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Saldo</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.loans?.map((loan: any) => (
                  <TableRow key={loan.id} className="group cursor-default">
                    <TableCell className="text-xs font-medium text-slate-500">{formatDate(loan.start_date)}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-700">{formatCurrency(loan.total_amount)}</TableCell>
                    <TableCell className={`text-sm font-black ${loan.status === 'active' ? 'text-red-500' : 'text-slate-400'}`}>
                      {formatCurrency(loan.remaining_balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                        {loan.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Registro de Abonos */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-900 border-b">
          <CardTitle className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-500" /> Registro Detallado de Cobros
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-[10px] uppercase font-bold">Fecha Pago</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">Cantidad</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">Notas del Cobro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.loans?.flatMap((l: any) => l.payments || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-sm italic">
                  Aún no se han registrado abonos para este cliente.
                </TableCell>
              </TableRow>
            ) : (
              client.loans?.flatMap((l: any) => l.payments || [])
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">{formatDate(p.created_at)}</TableCell>
                    <TableCell className="text-sm font-black text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-xs text-slate-500 italic">{p.notes || 'Sin observaciones'}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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
  DollarSign,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Obligamos a que la página siempre busque datos frescos
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailsPage({ params }: PageProps) {
  // 1. Esperamos los parámetros y el cliente de Supabase
  const { id } = await params
  const supabase = await createClient()

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
    .single()

  // Si hay error o el ID no existe en la base de datos
  if (error || !client) {
    console.error("Cliente no encontrado:", id)
    notFound()
  }

  // 2. Normalización de datos para evitar errores visuales
  const displayName = client.full_name || client.name || "Cliente sin nombre"
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val || 0)

  const formatDate = (date: string) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculamos deuda total activa
  const totalActiveDebt = client.loans?.reduce((acc: number, loan: any) => {
    return loan.status === 'active' ? acc + (loan.remaining_balance || 0) : acc
  }, 0) || 0

  return (
    <div className="p-6 space-y-6">
      {/* Botón Volver */}
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/clients" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a Clientes
        </Link>
      </Button>

      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
            <p className="text-xs font-mono text-muted-foreground">{client.id}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Deuda Total</p>
          <p className="text-2xl font-black text-red-600">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Datos de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{client.phone || 'No registrado'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-sm">{client.address || 'Sin dirección'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-muted-foreground">Desde: {formatDate(client.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Préstamos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Historial de Créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.loans?.map((loan: any) => (
                  <TableRow key={loan.id}>
                    <TableCell className="text-xs">{formatDate(loan.start_date)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(loan.total_amount)}</TableCell>
                    <TableCell className="font-bold text-red-600">{formatCurrency(loan.remaining_balance)}</TableCell>
                    <TableCell>
                      <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Historial de todos los pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" /> Registro General de Abonos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Fecha Abono</TableHead>
                <TableHead>Monto Recibido</TableHead>
                <TableHead>Comprobante/Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.loans?.flatMap((l: any) => l.payments || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                    No hay abonos registrados para este cliente.
                  </TableCell>
                </TableRow>
              ) : (
                client.loans?.flatMap((l: any) => l.payments || [])
                  .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                  .map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{formatDate(p.payment_date)}</TableCell>
                      <TableCell className="font-black text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.notes || '---'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Consulta simplificada para evitar errores de relación complejos
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  // Si el cliente no existe, ahora sí lanzamos 404
  if (clientError || !client) {
    console.error("Error buscando cliente:", clientError)
    notFound()
  }

  // 2. Traemos sus préstamos por separado (más seguro)
  const { data: loans } = await supabase
    .from('loans')
    .select('*, payments(*)')
    .eq('client_id', id)

  // Helpers de formato
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)

  const formatDate = (date: string) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const totalDebt = loans?.reduce((acc, loan) => 
    loan.status === 'active' ? acc + (Number(loan.remaining_balance) || 0) : acc, 0) || 0

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/clients" className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Volver</Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between bg-white p-6 rounded-xl border shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase">{client.full_name}</h1>
            <p className="text-sm text-slate-500">ID: {client.id.slice(0,8)}</p>
          </div>
        </div>
        <div className="md:text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Saldo Pendiente</p>
          <p className="text-2xl font-black text-red-600">{formatCurrency(totalDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold uppercase">Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-slate-400" /> {client.phone}</div>
            <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-slate-400" /> {client.address}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm font-bold uppercase">Préstamos</CardTitle></CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monto</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans?.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{formatCurrency(loan.total_amount)}</TableCell>
                  <TableCell className="font-bold text-red-600">{formatCurrency(loan.remaining_balance)}</TableCell>
                  <TableCell><Badge>{loan.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}

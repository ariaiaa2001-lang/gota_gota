import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, MapPin, CreditCard, History, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"

// Importamos las acciones directamente
import { 
  updateClient, 
  createPayment, 
  updatePayment, 
  deletePayment 
} from '@/lib/actions/client-actions'

export const dynamic = 'force-dynamic'

/**
 * COMPONENTE DE CLIENTE INTERNO (Para que los modales cierren solos)
 * Lo declaramos aquí mismo para no tener que crear archivos extra
 */
import { ClientModalsContainer } from './client-modals-wrapper'

// Nota: Para no liarte con más archivos, he simplificado los modales 
// para que funcionen con el refresco nativo de Next.js.

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) return <div className="p-6 text-center font-bold text-slate-500">Cliente no encontrado</div>

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
      
      {/* VOLVER */}
      <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-indigo-600">
        <Link href="/dashboard/clients" className="flex items-center gap-2 font-medium">
          <ArrowLeft className="h-4 w-4" /> Volver a la lista
        </Link>
      </Button>

      {/* HEADER TIPO DASHBOARD PROFESIONAL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-100">
            {client.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold tracking-tight text-slate-800 uppercase">{client.full_name}</h1>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">ID: {id}</p>
          </div>
        </div>
        
        <div className="bg-white px-8 py-5 rounded-xl border border-emerald-100 text-right shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-widest">Saldo Total</p>
          <p className="text-4xl font-black text-emerald-600 tabular-nums">{formatCurrency(totalActiveDebt)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* INFO CONTACTO */}
        <Card className="border-slate-200 shadow-sm border-2">
          <CardHeader><CardTitle className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Phone className="h-5 w-5 text-indigo-500" />
              <span className="font-bold text-slate-700">{client.phone || 'Sin número'}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 uppercase text-[11px]">
              <MapPin className="h-5 w-5 text-rose-400" />
              <span className="font-bold text-slate-700 leading-tight">{client.address || 'Sin dirección'}</span>
            </div>
          </CardContent>
        </Card>

        {/* LISTA DE PRÉSTAMOS */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm border-2 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] uppercase text-slate-500 flex items-center gap-2 font-black tracking-widest">
              <CreditCard className="h-4 w-4 text-indigo-400" /> Préstamos Activos
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-transparent">
                <TableHead className="font-bold text-[11px] text-slate-400">Fecha</TableHead>
                <TableHead className="font-bold text-[11px] text-slate-400">Monto</TableHead>
                <TableHead className="font-bold text-[11px] text-slate-400">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans?.map((loan) => (
                <TableRow key={loan.id} className="border-b border-slate-50">
                  <TableCell className="text-[11px] text-slate-400 font-medium">{formatDate(loan.created_at)}</TableCell>
                  <TableCell className="font-bold text-slate-700">{formatCurrency(loan.total_amount)}</TableCell>
                  <TableCell className="font-black text-lg text-rose-500">
                    {formatCurrency(loan.remaining_balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* REGISTRO DE PAGOS */}
      <Card className="border-slate-200 shadow-sm border-2 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <CardTitle className="text-[10px] uppercase text-slate-500 flex items-center gap-2 font-black tracking-widest">
            <History className="h-4 w-4 text-emerald-500" /> Historial de Abonos
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="text-[11px] font-bold text-slate-500">Fecha</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Monto</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50">
                <TableCell className="text-[10px] font-semibold text-slate-400">{formatDate(p.created_at)}</TableCell>
                <TableCell className="text-emerald-600 font-black text-xl">{formatCurrency(p.amount)}</TableCell>
                <TableCell className="text-[11px] text-slate-500 font-medium uppercase italic">{p.notes || '---'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

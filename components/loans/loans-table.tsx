'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { 
  MoreHorizontal, 
  Search, 
  Wallet, 
  User, 
  History, 
  ArrowDownCircle, 
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { RegisterPaymentDialog } from './register-payment-dialog'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Loan {
  id: string
  client_id: string
  principal_amount: number
  total_amount: number
  daily_payment: number
  remaining_balance: number
  start_date: string
  status: string
  clients: {
    id: string
    name: string
  } | null
}

export function LoansTable({ loans }: { loans: Loan[] }) {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null)
  
  // Estados para el Historial (Sheet)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Corregir error de hidratación #418
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
    })
  }

  const handleOpenHistory = async (loan: Loan) => {
    setSelectedLoan(loan)
    setLoadingHistory(true)
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('loan_id', loan.id)
      .order('payment_date', { ascending: false })

    if (!error) setPaymentHistory(data || [])
    setLoadingHistory(false)
  }

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = loan.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Activos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Cliente (Click para ver historial)</TableHead>
                  <TableHead className="hidden md:table-cell">Capital</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No se encontraron préstamos.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoans.map((loan) => (
                    <TableRow key={loan.id} className="hover:bg-transparent">
                      {/* ESTA CELDA ES EL BOTÓN DIRECTO */}
                      <TableCell className="p-0">
                        <button 
                          onClick={() => handleOpenHistory(loan)}
                          className="flex w-full items-center gap-3 p-4 text-left hover:bg-blue-50/50 transition-colors group"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-blue-600 group-hover:text-blue-800 truncate">
                              {loan.clients?.name || 'Sin nombre'}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatDate(loan.start_date)}
                            </span>
                          </div>
                        </button>
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-sm">
                        {formatCurrency(loan.principal_amount)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-red-600 text-sm">
                            {formatCurrency(loan.remaining_balance)}
                          </span>
                          <span className="text-[9px] text-muted-foreground sm:hidden uppercase">Saldo</span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                          {loan.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPayingLoan(loan)}>
                              Registrar Cobro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenHistory(loan)}>
                              Ver Historial
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/loans/${loan.id}`}>Detalles técnicos</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PANEL LATERAL DE HISTORIAL DIRECTO */}
      <Sheet open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <SheetContent className="w-full sm:max-w-md border-l-4 border-l-blue-500">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl font-black text-slate-800 uppercase tracking-tight">
              <History className="h-6 w-6 text-blue-600" />
              Historial
            </SheetTitle>
            <SheetDescription className="font-medium text-blue-600">
              {selectedLoan?.clients?.name}
            </SheetDescription>
          </SheetHeader>

          {selectedLoan && (
            <div className="space-y-6">
              {/* Tarjetas de Resumen Premium */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 shadow-sm">
                  <div className="flex items-center gap-1.5 text-red-600 mb-2">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">Pendiente</span>
                  </div>
                  <p className="text-xl font-black text-red-700 leading-none">
                    {formatCurrency(selectedLoan.remaining_balance)}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-1.5 text-blue-600 mb-2">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">Total</span>
                  </div>
                  <p className="text-xl font-black text-blue-700 leading-none">
                    {formatCurrency(selectedLoan.total_amount)}
                  </p>
                </div>
              </div>

              {/* Lista de Movimientos */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                  Pagos Realizados
                </h4>
                
                {loadingHistory ? (
                  <div className="flex flex-col items-center py-20 animate-pulse">
                    <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-bold text-slate-400">Consultando nube...</p>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-slate-50/50">
                    <Wallet className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400 italic">No hay abonos registrados.</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-1">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="group relative flex justify-between items-center p-4 rounded-2xl border bg-white hover:border-emerald-500 hover:shadow-md transition-all duration-300">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div>
                          <p className="text-lg font-black text-emerald-600 leading-none mb-1.5">
                            +{formatCurrency(payment.amount)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(payment.payment_date).toLocaleDateString('es-CO', { 
                              day: 'numeric', 
                              month: 'long'
                            })}
                          </p>
                        </div>
                        {payment.notes && (
                          <Badge variant="secondary" className="text-[9px] font-bold bg-slate-100 text-slate-500 max-w-[100px] truncate">
                            {payment.notes}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Diálogos */}
      {payingLoan && (
        <RegisterPaymentDialog
          loan={payingLoan}
          open={!!payingLoan}
          onOpenChange={(open) => !open && setPayingLoan(null)}
        />
      )}
    </>
  )
}

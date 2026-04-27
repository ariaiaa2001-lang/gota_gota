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
  DollarSign
} from 'lucide-react'
import { RegisterPaymentDialog } from './register-payment-dialog'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// --- Interfaces ---
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
  const [mounted, setMounted] = useState(false) // Para evitar error #418
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null)
  
  // Estados del Historial
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Evitar desajustes de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null 

  // Formateadores
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })

  // Filtrado
  const filteredLoans = loans.filter((l) => {
    const matchesSearch = l.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Lógica para abrir historial
  const handleOpenHistory = async (loan: Loan) => {
    console.log("Abriendo historial para:", loan.clients?.name) // Ver en consola si el clic funciona
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Activos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        {/* BOTÓN DEL NOMBRE */}
                        <button 
                          onClick={() => handleOpenHistory(loan)}
                          className="text-sm font-bold text-blue-600 hover:underline text-left leading-none"
                        >
                          {loan.clients?.name || 'Sin nombre'}
                        </button>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {formatDate(loan.start_date)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatCurrency(loan.principal_amount)}</TableCell>
                  <TableCell className="text-sm font-bold text-red-600">{formatCurrency(loan.remaining_balance)}</TableCell>
                  <TableCell>
                    <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPayingLoan(loan)}>Registrar Cobro</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenHistory(loan)}>Historial</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* COMPONENTE SHEET (EL QUE SE DESPLIEGA) */}
      <Sheet open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Pagos de {selectedLoan?.clients?.name}
            </SheetTitle>
            <SheetDescription>Historial completo de abonos recibidos.</SheetDescription>
          </SheetHeader>

          {selectedLoan && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-[10px] font-bold text-red-600 uppercase">Saldo Pendiente</p>
                  <p className="text-lg font-black text-red-700">{formatCurrency(selectedLoan.remaining_balance)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Total Préstamo</p>
                  <p className="text-lg font-black text-blue-700">{formatCurrency(selectedLoan.total_amount)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4" /> Movimientos
                </h4>
                {loadingHistory ? (
                  <p className="text-center py-4 text-sm animate-pulse">Cargando...</p>
                ) : paymentHistory.length === 0 ? (
                  <p className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed rounded-xl">Sin pagos aún.</p>
                ) : (
                  paymentHistory.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg shadow-sm">
                      <div>
                        <p className="font-bold text-emerald-600">+{formatCurrency(p.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {payingLoan && (
        <RegisterPaymentDialog 
          loan={payingLoan} 
          open={!!payingLoan} 
          onOpenChange={(o) => !o && setPayingLoan(null)} 
        />
      )}
    </>
  )
}

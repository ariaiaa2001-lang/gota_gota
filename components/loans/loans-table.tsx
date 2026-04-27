'use client'

import { useState } from 'react'
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
} from "@/components/ui/sheet" // Asegúrate de tener este componente
import { MoreHorizontal, Search, Wallet, User, History, ArrowDownCircle } from 'lucide-react'
import { RegisterPaymentDialog } from './register-payment-dialog'
import { createClient } from '@/lib/supabase/client' // Importamos el cliente para la sub-consulta
import Link from 'next/link'

// ... interfaces y funciones formatCurrency/formatDate se mantienen igual ...
interface Client {
  id: string
  name: string
  phone: string | null
}

interface Loan {
  id: string
  client_id: string
  principal_amount: number
  interest_rate: number
  total_amount: number
  daily_payment: number
  total_days: number
  remaining_balance: number
  start_date: string
  end_date: string
  status: string
  created_at: string
  clients: Client | null
}

interface LoansTableProps {
  loans: Loan[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const statusConfig = {
  active: { label: 'Activo', variant: 'default' as const },
  completed: { label: 'Completado', variant: 'secondary' as const },
  overdue: { label: 'Vencido', variant: 'destructive' as const },
}

export function LoansTable({ loans }: LoansTableProps) {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null)
  
  // Estados para el Historial
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.clients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.clients?.phone?.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Función para obtener el historial cuando se hace clic
  const handleOpenHistory = async (loan: Loan) => {
    setSelectedLoan(loan)
    setLoadingHistory(true)
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('loan_id', loan.id)
      .order('payment_date', { ascending: false })

    if (!error) {
      setPaymentHistory(data || [])
    }
    setLoadingHistory(false)
  }

  const getProgressPercentage = (loan: Loan) => {
    const paid = Number(loan.total_amount) - Number(loan.remaining_balance)
    return Math.round((paid / Number(loan.total_amount)) * 100)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Activos</TabsTrigger>
                <TabsTrigger value="completed">Completados</TabsTrigger>
                <TabsTrigger value="overdue">Vencidos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLoans.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No hay prestamos</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'No se encontraron prestamos con esos filtros'
                  : 'Crea tu primer prestamo para comenzar'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Capital</TableHead>
                    <TableHead>Cuota Diaria</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => {
                    const progress = getProgressPercentage(loan)
                    const config = statusConfig[loan.status as keyof typeof statusConfig]

                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              {/* NOMBRE DEL CLIENTE COMO BOTÓN PARA EL HISTORIAL */}
                              <button 
                                onClick={() => handleOpenHistory(loan)}
                                className="font-medium hover:underline text-left text-primary"
                              >
                                {loan.clients?.name}
                              </button>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(loan.start_date)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(loan.principal_amount))}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(loan.daily_payment))}
                        </TableCell>
                        <TableCell>
                          <span className={loan.status === 'active' ? 'text-amber-600 font-medium' : ''}>
                            {formatCurrency(Number(loan.remaining_balance))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/loans/${loan.id}`}>
                                  Ver detalles
                                </Link>
                              </DropdownMenuItem>
                              {loan.status === 'active' && (
                                <DropdownMenuItem onClick={() => setPayingLoan(loan)}>
                                  Registrar cobro
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleOpenHistory(loan)}>
                                Ver historial de pagos
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PANEL LATERAL DE HISTORIAL */}
      <Sheet open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Pagos
            </SheetTitle>
            <SheetDescription>
              Resumen de abonos para {selectedLoan?.clients?.name}
            </SheetDescription>
          </SheetHeader>

          {selectedLoan && (
            <div className="space-y-6">
              {/* Resumen rápido en el panel */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Saldo Actual</p>
                  <p className="text-lg font-bold text-amber-600">
                    {formatCurrency(selectedLoan.remaining_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Meta Total</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedLoan.total_amount)}
                  </p>
                </div>
              </div>

              {/* Lista de pagos */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                  Pagos realizados
                </h4>
                
                {loadingHistory ? (
                  <div className="py-8 text-center text-muted-foreground">Cargando historial...</div>
                ) : paymentHistory.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    No se han registrado pagos aún.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-muted ml-2 pl-4 space-y-6">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="relative">
                        <div className="absolute -left-[25px] top-1 h-4 w-4 rounded-full bg-emerald-500 border-4 border-background" />
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-emerald-600">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleDateString('es-CO', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </p>
                          </div>
                          {payment.notes && (
                            <Badge variant="outline" className="text-[10px] max-w-[100px] truncate">
                              {payment.notes}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* DIÁLOGOS EXISTENTES */}
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

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
import { MoreHorizontal, Search, Wallet, User } from 'lucide-react'
import { RegisterPaymentDialog } from './register-payment-dialog'
import Link from 'next/link'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null)

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.clients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.clients?.phone?.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
                              <p className="font-medium">{loan.clients?.name}</p>
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

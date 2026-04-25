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
import { MoreHorizontal, Search, Receipt, Trash2 } from 'lucide-react'
import { DeleteExpenseDialog } from './delete-expense-dialog'

interface Expense {
  id: string
  description: string
  amount: number
  expense_date: string
  category: string
  created_at: string
}

interface ExpensesTableProps {
  expenses: Expense[]
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

const categoryLabels: Record<string, string> = {
  general: 'General',
  transport: 'Transporte',
  food: 'Alimentacion',
  utilities: 'Servicios',
  supplies: 'Suministros',
  other: 'Otro',
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripcion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No hay egresos</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'No se encontraron egresos con esa busqueda'
                  : 'Agrega tu primer egreso para comenzar'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                            <Receipt className="h-5 w-5 text-red-600" />
                          </div>
                          <span className="font-medium">{expense.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[expense.category] || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(expense.expense_date)}</TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(Number(expense.amount))}
                        </span>
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
                            <DropdownMenuItem
                              onClick={() => setDeletingExpense(expense)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {deletingExpense && (
        <DeleteExpenseDialog
          expense={deletingExpense}
          open={!!deletingExpense}
          onOpenChange={(open) => !open && setDeletingExpense(null)}
        />
      )}
    </>
  )
}

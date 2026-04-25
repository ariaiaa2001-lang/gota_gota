import { createClient } from '@/lib/supabase/server'
import { ExpensesTable } from '@/components/expenses/expenses-table'
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Calendar } from 'lucide-react'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [{ data: expenses }, { data: monthExpenses }] = await Promise.all([
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false })
      .limit(100),
    supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('expense_date', startOfMonth),
  ])

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const monthTotal = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Egresos</h1>
          <p className="text-muted-foreground">
            Registro de gastos y egresos
          </p>
        </div>
        <AddExpenseDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Egresos del Mes
            </CardTitle>
            <div className="rounded-md bg-red-50 p-2">
              <Calendar className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthExpenses?.length || 0} gastos este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Historico
            </CardTitle>
            <div className="rounded-md bg-muted p-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses?.length || 0} gastos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      <ExpensesTable expenses={expenses || []} />
    </div>
  )
}

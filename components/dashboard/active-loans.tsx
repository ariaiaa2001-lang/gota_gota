import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Loan {
  id: string
  principal_amount: number
  remaining_balance: number
  daily_payment: number
  total_days: number
  start_date: string
  status: string
}

interface ActiveLoansProps {
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

export function ActiveLoans({ loans }: ActiveLoansProps) {
  const getProgressPercentage = (loan: Loan) => {
    const paid = Number(loan.principal_amount) * 1.2 - Number(loan.remaining_balance)
    const total = Number(loan.principal_amount) * 1.2
    return Math.round((paid / total) * 100)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Prestamos Activos</CardTitle>
          <CardDescription>Ultimos prestamos en curso</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/loans">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loans.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay prestamos activos
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCurrency(Number(loan.principal_amount))}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {getProgressPercentage(loan)}% pagado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cuota: {formatCurrency(Number(loan.daily_payment))}/dia
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">
                    {formatCurrency(Number(loan.remaining_balance))}
                  </p>
                  <p className="text-xs text-muted-foreground">Pendiente</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

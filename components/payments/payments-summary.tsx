import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Calendar, TrendingUp } from 'lucide-react'

interface PaymentsSummaryProps {
  todayTotal: number
  monthTotal: number
  todayCount: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PaymentsSummary({ todayTotal, monthTotal, todayCount }: PaymentsSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cobros de Hoy
          </CardTitle>
          <div className="rounded-md bg-green-50 p-2">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(todayTotal)}</div>
          <p className="text-xs text-muted-foreground">{todayCount} cobros realizados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cobros del Mes
          </CardTitle>
          <div className="rounded-md bg-blue-50 p-2">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthTotal)}</div>
          <p className="text-xs text-muted-foreground">Total acumulado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Promedio Diario
          </CardTitle>
          <div className="rounded-md bg-primary/10 p-2">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(monthTotal / Math.max(new Date().getDate(), 1))}
          </div>
          <p className="text-xs text-muted-foreground">Este mes</p>
        </CardContent>
      </Card>
    </div>
  )
}

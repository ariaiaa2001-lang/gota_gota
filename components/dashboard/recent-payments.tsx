import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Payment {
  id: string
  amount: number
  payment_date: string
  created_at: string
  clients: { name: string } | null
}

interface RecentPaymentsProps {
  payments: Payment[]
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
  })
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecentPayments({ payments }: RecentPaymentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cobros Recientes</CardTitle>
          <CardDescription>Ultimos pagos registrados</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/payments">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay cobros registrados
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {payment.clients?.name || 'Cliente'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(payment.payment_date)} - {formatTime(payment.created_at)}
                  </p>
                </div>
                <div className="font-medium text-green-600">
                  +{formatCurrency(Number(payment.amount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

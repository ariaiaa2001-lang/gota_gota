import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Wallet, DollarSign, TrendingUp, Calendar, Receipt } from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    totalClients: number
    activeLoans: number
    totalLent: number
    totalToCollect: number
    todayCollections: number
    totalExpenses: number
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Clientes',
      value: stats.totalClients.toString(),
      icon: Users,
      description: 'Clientes registrados',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Prestamos Activos',
      value: stats.activeLoans.toString(),
      icon: Wallet,
      description: 'En curso actualmente',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Capital Prestado',
      value: formatCurrency(stats.totalLent),
      icon: TrendingUp,
      description: 'En prestamos activos',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Por Cobrar',
      value: formatCurrency(stats.totalToCollect),
      icon: DollarSign,
      description: 'Saldo pendiente total',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Cobro del Dia',
      value: formatCurrency(stats.todayCollections),
      icon: Calendar,
      description: 'Meta diaria de cobros',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Egresos',
      value: formatCurrency(stats.totalExpenses),
      icon: Receipt,
      description: 'Gastos registrados',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`rounded-md p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

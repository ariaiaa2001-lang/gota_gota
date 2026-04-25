'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Calculator } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
}

interface AddLoanDialogProps {
  clients: Client[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function AddLoanDialog({ clients }: AddLoanDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [interestRate, setInterestRate] = useState('20')
  const [totalDays, setTotalDays] = useState('30')
  const router = useRouter()

  const calculations = useMemo(() => {
    const principal = parseFloat(principalAmount) || 0
    const rate = parseFloat(interestRate) || 0
    const days = parseInt(totalDays) || 0

    const interest = principal * (rate / 100)
    const totalAmount = principal + interest
    const dailyPayment = days > 0 ? Math.ceil(totalAmount / days) : 0

    return {
      interest,
      totalAmount,
      dailyPayment,
    }
  }, [principalAmount, interestRate, totalDays])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('No se pudo obtener el usuario')
        return
      }

      const principal = parseFloat(principalAmount)
      const days = parseInt(totalDays)
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)

      const { error } = await supabase.from('loans').insert({
        user_id: user.id,
        client_id: clientId,
        principal_amount: principal,
        interest_rate: parseFloat(interestRate),
        total_amount: calculations.totalAmount,
        daily_payment: calculations.dailyPayment,
        total_days: days,
        remaining_balance: calculations.totalAmount,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
      })

      if (error) throw error

      toast.success('Prestamo creado exitosamente')
      setOpen(false)
      setClientId('')
      setPrincipalAmount('')
      setInterestRate('20')
      setTotalDays('30')
      router.refresh()
    } catch (error) {
      toast.error('Error al crear el prestamo')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Prestamo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Prestamo</DialogTitle>
          <DialogDescription>
            Configura los terminos del prestamo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Capital (COP) *</Label>
              <Input
                id="principal"
                type="number"
                placeholder="100000"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                min="1000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest">Interes (%)</Label>
              <Input
                id="interest"
                type="number"
                placeholder="20"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Plazo (dias)</Label>
            <Input
              id="days"
              type="number"
              placeholder="30"
              value={totalDays}
              onChange={(e) => setTotalDays(e.target.value)}
              min="1"
              max="365"
            />
          </div>

          {parseFloat(principalAmount) > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Calculator className="h-4 w-4" />
                Resumen del Prestamo
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capital:</span>
                  <span>{formatCurrency(parseFloat(principalAmount) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interes ({interestRate}%):</span>
                  <span>{formatCurrency(calculations.interest)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total a pagar:</span>
                  <span className="text-primary">{formatCurrency(calculations.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota diaria:</span>
                  <span className="font-medium">{formatCurrency(calculations.dailyPayment)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !clientId || !principalAmount}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Prestamo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

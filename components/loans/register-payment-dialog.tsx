'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Loan {
  id: string
  client_id: string
  daily_payment: number
  remaining_balance: number
  clients: { name: string } | null
}

interface RegisterPaymentDialogProps {
  loan: Loan
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function RegisterPaymentDialog({ loan, open, onOpenChange }: RegisterPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState(loan.daily_payment.toString())
  const [notes, setNotes] = useState('')
  const router = useRouter()

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

      const paymentAmount = parseFloat(amount)
      const newBalance = Number(loan.remaining_balance) - paymentAmount

      // Insert the payment
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: user.id,
        loan_id: loan.id,
        client_id: loan.client_id,
        amount: paymentAmount,
        payment_date: new Date().toISOString().split('T')[0],
        notes: notes || null,
      })

      if (paymentError) throw paymentError

      // Update the loan balance
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          remaining_balance: Math.max(0, newBalance),
          status: newBalance <= 0 ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', loan.id)

      if (loanError) throw loanError

      toast.success('Cobro registrado exitosamente')
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error('Error al registrar el cobro')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Cobro</DialogTitle>
          <DialogDescription>
            Registrar pago de {loan.clients?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo pendiente:</span>
              <span className="font-medium text-amber-600">
                {formatCurrency(Number(loan.remaining_balance))}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">Cuota sugerida:</span>
              <span className="font-medium">
                {formatCurrency(Number(loan.daily_payment))}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto del Cobro *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="1"
                max={loan.remaining_balance}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agregar una nota sobre este cobro..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Cobro
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

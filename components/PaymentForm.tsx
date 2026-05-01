'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createPayment } from '@/lib/actions/client-actions'

interface PaymentFormProps {
  loanId: string
  clientId: string
}

export function PaymentForm({ loanId, clientId }: PaymentFormProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    await createPayment(loanId, clientId, formData)
    // ESTO es lo que cierra la ventana automáticamente
    setOpen(false) 
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-600 font-bold text-[10px] h-8 px-4 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm">
          + ABONAR
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Pago</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Valor Recibido</Label>
            <Input name="amount" type="number" required className="text-3xl font-black h-16 border-2 border-slate-100 focus:border-emerald-500 transition-all" placeholder="$ 0" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Fecha de Pago</Label>
            <Input name="date" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Observaciones</Label>
            <Textarea name="notes" placeholder="Detalles del abono..." />
          </div>
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 h-12 font-bold text-lg">
            GUARDAR ABONO
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

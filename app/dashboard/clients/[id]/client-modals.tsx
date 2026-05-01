'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"

// MODAL PARA ABONAR
export function PaymentModal({ loanId, clientId, createPaymentAction }: any) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-600 font-bold text-[10px] h-8 px-4 hover:bg-indigo-600 hover:text-white rounded-lg shadow-sm">
          + ABONAR
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar Nuevo Pago</DialogTitle></DialogHeader>
        <form action={async (formData) => { await createPaymentAction(loanId, clientId, formData); setOpen(false); }} className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Valor Recibido</Label>
            <Input name="amount" type="number" required className="text-3xl font-black h-16 border-2 border-slate-100 focus:border-emerald-500" placeholder="$ 0" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Fecha de Pago</Label>
            <Input name="date" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Observaciones</Label>
            <Textarea name="notes" placeholder="Detalles del abono..." />
          </div>
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 h-12 font-bold text-lg">GUARDAR ABONO</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// MODAL PARA EDITAR PAGO
export function EditPaymentModal({ payment, clientId, updatePaymentAction }: any) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Corregir Abono</DialogTitle></DialogHeader>
        <form action={async (formData) => { await updatePaymentAction(payment.id, clientId, formData); setOpen(false); }} className="space-y-4 pt-4">
          <div className="space-y-1"><Label>Monto Correcto</Label><Input name="amount" type="number" defaultValue={payment.amount} required className="text-xl font-bold" /></div>
          <div className="space-y-1"><Label>Fecha Real</Label><Input name="date" type="datetime-local" defaultValue={new Date(payment.created_at).toISOString().slice(0, 16)} required /></div>
          <div className="space-y-1"><Label>Nota</Label><Textarea name="notes" defaultValue={payment.notes} /></div>
          <Button type="submit" className="w-full bg-blue-600">Actualizar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// MODAL PARA ELIMINAR PAGO
export function DeletePaymentModal({ payment, clientId, deletePaymentAction, formatCurrency }: any) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-rose-600">¿Eliminar registro?</DialogTitle></DialogHeader>
        <div className="py-4 text-sm text-slate-600">Vas a eliminar el abono de <span className="font-bold text-slate-900">{formatCurrency(payment.amount)}</span>.</div>
        <DialogFooter>
          <form action={async () => { await deletePaymentAction(payment.id, clientId); setOpen(false); }} className="w-full">
            <Button type="submit" variant="destructive" className="w-full bg-rose-600 font-bold">SÍ, ELIMINAR AHORA</Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// MODAL EDITAR CLIENTE
export function EditClientModal({ client, updateClientAction }: any) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Datos del Cliente</DialogTitle></DialogHeader>
        <form action={async (formData) => { await updateClientAction(client.id, formData); setOpen(false); }} className="space-y-4 pt-4">
          <div className="space-y-2"><Label>Nombre Completo</Label><Input name="full_name" defaultValue={client.full_name} required /></div>
          <div className="space-y-2"><Label>Teléfono</Label><Input name="phone" defaultValue={client.phone} /></div>
          <div className="space-y-2"><Label>Cobrador / Dirección</Label><Input name="address" defaultValue={client.address} /></div>
          <Button type="submit" className="w-full bg-indigo-600">Actualizar Cliente</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

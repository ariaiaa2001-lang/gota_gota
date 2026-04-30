"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client" 

export function CreatePaymentDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    client_id: "",
    amount: "",
    notes: ""
  })

  useEffect(() => {
    if (open) {
      const fetchClients = async () => {
        const { data } = await supabase
          .from('clients')
          .select('id, full_name')
          .order('full_name')
        if (data) setClients(data)
      }
      fetchClients()
    }
  }, [open, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: loan } = await supabase
        .from('loans')
        .select('id')
        .eq('client_id', formData.client_id)
        .eq('status', 'active')
        .maybeSingle()

      const { error } = await supabase.from('payments').insert({
        user_id: user?.id,
        client_id: formData.client_id,
        loan_id: loan?.id || null,
        amount: parseFloat(formData.amount),
        payment_date: new Date().toISOString().split('T')[0],
        notes: formData.notes
      })

      if (error) throw error

      setOpen(false)
      setFormData({ client_id: "", amount: "", notes: "" })
      router.refresh() 
    } catch (error) {
      console.error("Error:", error)
      alert("No se pudo registrar el pago. Verifica que el cliente tenga un préstamo activo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <PlusCircle className="mr-2 h-4 w-4" />
          Registrar Cobro Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Registrar Cobro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label className="text-slate-700">Cliente</Label>
            <select 
              required
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.client_id}
              onChange={(e) => setFormData({...formData, client_id: e.target.value})}
            >
              <option value="">Seleccione un cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-slate-700">Valor a Cobrar ($)</Label>
            <Input 
              type="number" 
              placeholder="0.00" 
              required
              className="focus:ring-emerald-500"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-700">Observaciones</Label>
            <Input 
              placeholder="Opcional..." 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 w-full text-white py-6 text-lg font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "PROCESAR PAGO"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

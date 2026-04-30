"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function CreateClientDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const full_name = formData.get("full_name") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string

    const { error } = await supabase
      .from("clients")
      .insert([{ full_name, phone, address }])

    if (error) {
      alert("Error al crear cliente: " + error.message)
    } else {
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <PlusCircle className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input type="text" id="full_name" name="full_name" placeholder="Ej: Juan Pérez" required />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="phone">Teléfono / WhatsApp</Label>
            <Input type="text" id="phone" name="phone" placeholder="300 123 4567" required />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="address">Dirección / Referencia</Label>
            <Input type="text" id="address" name="address" placeholder="Barrio - Calle - Casa" required />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

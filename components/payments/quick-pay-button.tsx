"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Banknote, Loader2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function QuickPayButton({ loanId, clientId, amount }: { loanId: string, clientId: string, amount: number }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handlePay = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.from('payments').insert({
        user_id: user?.id,
        loan_id: loanId,
        client_id: clientId,
        amount: amount,
        payment_date: new Date().toISOString().split('T')[0],
        notes: "Cobro rápido de ruta diaria"
      })

      if (error) throw error
      
      setSuccess(true)
      router.refresh() // Esto hace que desaparezca de la lista de pendientes
    } catch (e) {
      console.error(e)
      alert("Error al procesar cobro")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Button disabled className="bg-emerald-100 text-emerald-700 border-emerald-200">
        <Check className="h-4 w-4 mr-1" /> Cobrado
      </Button>
    )
  }

  return (
    <Button 
      onClick={handlePay} 
      disabled={loading} 
      size="sm" 
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Banknote className="h-4 w-4 mr-1" /> COBRAR</>}
    </Button>
  )
}

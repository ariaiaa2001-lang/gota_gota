"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Banknote, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function QuickPayButton({ loanId, clientId, amount }: { loanId: string, clientId: string, amount: number }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
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
        notes: "Cobro diario rápido"
      })

      if (error) throw error
      
      setDone(true)
      router.refresh()
    } catch (error) {
      alert("Error al registrar cobro")
    } finally {
      setLoading(false)
    }
  }

  if (done) return <Button disabled className="bg-emerald-100 text-emerald-700 size-sm"><Check className="h-4 w-4 mr-1" /> Pagado</Button>

  return (
    <Button 
      onClick={handlePay} 
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white size-sm"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Banknote className="h-4 w-4 mr-1" /> Cobrar</>}
    </Button>
  )
}

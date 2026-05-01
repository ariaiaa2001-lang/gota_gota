'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Editar datos básicos del cliente
export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient()
  const data = {
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
  }

  const { error } = await supabase.from('clients').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  
  revalidatePath(`/dashboard/clients/${id}`)
}

// Registrar un pago con fecha personalizada
export async function createPayment(loanId: string, clientId: string, formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    loan_id: loanId,
    amount: Number(formData.get('amount')),
    notes: formData.get('notes'),
    created_at: formData.get('date'), // Aquí permitimos la fecha manual
  }

  // 1. Insertar el pago
  const { error: paymentError } = await supabase.from('payments').insert(data)
  if (paymentError) throw new Error(paymentError.message)

  // 2. Opcional: Actualizar el saldo del préstamo automáticamente
  // Deberías restar el 'amount' al 'remaining_balance' del préstamo
  
  revalidatePath(`/dashboard/clients/${clientId}`)
}

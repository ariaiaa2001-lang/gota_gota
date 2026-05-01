'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ACTUALIZAR DATOS DEL CLIENTE
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

// CREAR NUEVO ABONO
export async function createPayment(loanId: string, clientId: string, formData: FormData) {
  const supabase = await createClient()
  const data = {
    loan_id: loanId,
    amount: Number(formData.get('amount')),
    notes: formData.get('notes'),
    created_at: formData.get('date'),
  }
  const { error } = await supabase.from('payments').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/clients/${clientId}`)
}

// EDITAR ABONO EXISTENTE
export async function updatePayment(paymentId: string, clientId: string, formData: FormData) {
  const supabase = await createClient()
  const data = {
    amount: Number(formData.get('amount')),
    notes: formData.get('notes'),
    created_at: formData.get('date'),
  }
  const { error } = await supabase.from('payments').update(data).eq('id', paymentId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/clients/${clientId}`)
}

// ELIMINAR ABONO
export async function deletePayment(paymentId: string, clientId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('payments').delete().eq('id', paymentId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/clients/${clientId}`)
}

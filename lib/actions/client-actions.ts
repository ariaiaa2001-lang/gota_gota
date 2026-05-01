'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. EDITAR DATOS DEL CLIENTE
export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
  }

  const { error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating client:', error)
    throw new Error('No se pudo actualizar el cliente')
  }
  
  revalidatePath(`/dashboard/clients/${id}`)
}

// 2. CREAR UN NUEVO ABONO
export async function createPayment(loanId: string, clientId: string, formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    loan_id: loanId,
    amount: Number(formData.get('amount')),
    notes: formData.get('notes'),
    created_at: formData.get('date'), // Fecha manual
  }

  const { error } = await supabase.from('payments').insert(data)

  if (error) {
    console.error('Error creating payment:', error)
    throw new Error('No se pudo registrar el pago')
  }
  
  revalidatePath(`/dashboard/clients/${clientId}`)
}

// 3. EDITAR UN ABONO EXISTENTE (CORRECCIÓN)
export async function updatePayment(paymentId: string, clientId: string, formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    amount: Number(formData.get('amount')),
    notes: formData.get('notes'),
    created_at: formData.get('date'), // Permite corregir la fecha en el historial
  }

  const { error } = await supabase
    .from('payments')
    .update(data)
    .eq('id', paymentId)

  if (error) {
    console.error('Error updating payment:', error)
    throw new Error('No se pudo corregir el pago')
  }
  
  revalidatePath(`/dashboard/clients/${clientId}`)
}

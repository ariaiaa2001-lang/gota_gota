'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Payment {
  id: string
  amount: number
  payment_date: string
  notes: string
  client_name: string
  loan_info: string
}

export function PaymentsTable({ payments }: { payments: Payment[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id)
      if (error) throw error

      toast.success("Cobro eliminado correctamente")
      router.refresh()
    } catch (error: any) {
      toast.error("Error: " + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Notas</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              <div className="font-medium text-sm">{payment.client_name}</div>
              <div className="text-[10px] uppercase text-muted-foreground">{payment.loan_info}</div>
            </TableCell>
            <TableCell className="text-sm">{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
            <TableCell className="text-emerald-600 font-bold text-sm">
              +${Number(payment.amount).toLocaleString()}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs italic">
              {payment.notes || '-'}
            </TableCell>
            <TableCell className="text-right">
              {/* VENTANA PERSONALIZADA (MODAL) */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl">
                      ¿Confirmar eliminación?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                      Esta acción no se puede deshacer. El cobro de **${Number(payment.amount).toLocaleString()}** será borrado y el saldo del préstamo se ajustará automáticamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="sm:justify-center gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(payment.id)}
                      className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Eliminando..." : "Sí, eliminar cobro"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

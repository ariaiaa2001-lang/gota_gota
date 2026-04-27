'use client'

import { createClient } from '@/lib/supabase/client'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react" // Importamos el icono de basura
import { useRouter } from 'next/navigation'
import { toast } from "sonner" // Asegúrate de tener instalada esta librería o usa alert()

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

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("¿Estás seguro? Al eliminar este cobro, el saldo del préstamo aumentará automáticamente.")
    
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success("Cobro eliminado")
      router.refresh() // Esto obliga a la página a pedir los datos nuevos
    } catch (error: any) {
      console.error("Error al borrar:", error.message)
      alert("No se pudo eliminar: " + error.message)
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
          <TableHead className="text-right w-[100px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
              No hay cobros registrados
            </TableCell>
          </TableRow>
        ) : (
          payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div className="font-medium">{payment.client_name}</div>
                <div className="text-xs text-muted-foreground">{payment.loan_info}</div>
              </TableCell>
              <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
              <TableCell className="text-emerald-600 font-bold">
                +${Number(payment.amount).toLocaleString()}
              </TableCell>
              <TableCell className="max-w-[200px] truncate italic text-muted-foreground">
                {payment.notes || '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(payment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

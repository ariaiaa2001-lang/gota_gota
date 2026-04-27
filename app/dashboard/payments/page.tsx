

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
import { Trash2 } from "lucide-react" // Icono de basura
import { useRouter } from 'next/navigation'
import { toast } from "sonner" // O la librería de alertas que uses

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
    const confirmDelete = window.confirm("¿Estás seguro de eliminar este cobro? El saldo del préstamo se restaurará automáticamente.")
    
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success("Cobro eliminado correctamente")
      router.refresh() // Refresca los datos de la página
    } catch (error: any) {
      console.error("Error:", error.message)
      toast.error("No se pudo eliminar el cobro")
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
              <div className="font-medium">{payment.client_name}</div>
              <div className="text-xs text-muted-foreground">{payment.loan_info}</div>
            </TableCell>
            <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
            <TableCell className="text-emerald-600 font-bold">
              +${Number(payment.amount).toLocaleString()}
            </TableCell>
            <TableCell className="text-muted-foreground italic">
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
        ))}
      </TableBody>
    </Table>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2 } from 'lucide-react' // Añadido Trash2 para mejor UI
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { buttonVariants } from '@/components/ui/button' // Importamos variantes para asegurar el estilo

interface Client {
  id: string
  name: string
}

interface DeleteClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteClientDialog({ client, open, onOpenChange }: DeleteClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    // Evitamos que el evento cierre el diálogo antes de tiempo si es necesario
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id)

      if (error) throw error

      toast.success('Cliente eliminado exitosamente')
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      // Mensaje más específico si es un error de clave foránea (préstamos activos)
      const message = error.code === '23503' 
        ? 'No se puede eliminar: El cliente tiene préstamos o historial activo.'
        : 'Error al eliminar el cliente.'
      
      toast.error(message)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Eliminar Cliente
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar a <strong>{client.name}</strong>?
            <br /><br />
            Esta acción **no se puede deshacer** y borrará permanentemente al cliente de la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          
          {/* CORRECCIÓN DEL BOTÓN:
              Añadimos "text-white" explícito y "font-bold" para que resalte.
              Usamos onClick={handleDelete} directamente.
          */}
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700 font-bold border-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Confirmar Eliminación'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

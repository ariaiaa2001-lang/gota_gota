import { createClient } from '@/lib/supabase/server'
import { LoansTable } from '@/components/loans/loans-table'
import { AddLoanDialog } from '@/components/loans/add-loan-dialog'

export default async function LoansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: loans }, { data: clients }] = await Promise.all([
    supabase
      .from('loans')
      .select(`
        *,
        clients(id, name, phone)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name'),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prestamos</h1>
          <p className="text-muted-foreground">
            Administra todos los prestamos de tu cartera
          </p>
        </div>
        <AddLoanDialog clients={clients || []} />
      </div>

      <LoansTable loans={loans || []} />
    </div>
  )
}

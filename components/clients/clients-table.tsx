'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoreHorizontal, Search, User, Phone, MapPin, Wallet } from 'lucide-react'
import { EditClientDialog } from './edit-client-dialog'
import { DeleteClientDialog } from './delete-client-dialog'
import Link from 'next/link'

interface Loan {
  id: string
  status: string
  remaining_balance: number
}

interface Client {
  id: string
  name: string
  phone: string | null
  address: string | null
  created_at: string
  loans: Loan[]
}

interface ClientsTableProps {
  clients: Client[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery) ||
    client.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getActiveLoans = (loans: Loan[]) => loans.filter(l => l.status === 'active')
  const getTotalDebt = (loans: Loan[]) => 
    getActiveLoans(loans).reduce((sum, loan) => sum + Number(loan.remaining_balance), 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, telefono o direccion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="py-12 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No hay clientes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'No se encontraron clientes con esa busqueda'
                  : 'Agrega tu primer cliente para comenzar'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Prestamos Activos</TableHead>
                    <TableHead>Deuda Total</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const activeLoans = getActiveLoans(client.loans)
                    const totalDebt = getTotalDebt(client.loans)

                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              {client.address && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {client.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.phone ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {activeLoans.length > 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <Wallet className="h-3 w-3" />
                              {activeLoans.length}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Sin prestamos</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {totalDebt > 0 ? (
                            <span className="font-medium text-amber-600">
                              {formatCurrency(totalDebt)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/clients/${client.id}`}>
                                  Ver detalles
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingClient(client)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingClient(client)}
                                className="text-destructive focus:text-destructive"
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingClient && (
        <EditClientDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      )}

      {deletingClient && (
        <DeleteClientDialog
          client={deletingClient}
          open={!!deletingClient}
          onOpenChange={(open) => !open && setDeletingClient(null)}
        />
      )}
    </>
  )
}

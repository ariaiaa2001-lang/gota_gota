'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Search, User, Phone, MapPin, Wallet, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

export function ClientsTable({ clients = [] }: { clients: any[] }) {
  const [search, setSearch] = useState('')

  const filtered = clients.filter(c => 
    c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  return (
    <Card>
      <CardHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar cliente..." 
            className="pl-10" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Préstamos</TableHead>
                <TableHead>Deuda</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => {
                const activeLoans = client.loans.filter((l: any) => l.status === 'active')
                const debt = activeLoans.reduce((acc: number, l: any) => acc + (l.remaining_balance || 0), 0)

                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{client.display_name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {client.address || 'Sin dirección'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" /> {client.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activeLoans.length > 0 ? "default" : "outline"}>
                        {activeLoans.length} activos
                      </Badge>
                    </TableCell>
                    <TableCell className="text-amber-600 font-semibold">
                      {formatMoney(debt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/clients/${client.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

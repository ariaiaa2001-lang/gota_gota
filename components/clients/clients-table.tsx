'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Search, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

export function ClientsTable({ clients = [] }: { clients: any[] }) {
  const [search, setSearch] = useState('')

  const filtered = clients.filter(c => 
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(amount)

  return (
    <Card>
      <CardHeader>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar..." 
            className="pl-10" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Préstamos</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{client.full_name}</span>
                      <span className="text-xs text-muted-foreground">{client.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <Badge variant={client.active_loans_count > 0 ? "default" : "secondary"}>
                      {client.active_loans_count} activos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(client.total_pending)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" asChild>
                      <Link href={`/dashboard/clients/${client.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

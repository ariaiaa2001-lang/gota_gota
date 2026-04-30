'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Search, User, Phone, MapPin, Wallet } from 'lucide-react'
import Link from 'next/link'

export function ClientsTable({ clients = [] }: { clients: any[] }) {
  const [search, setSearch] = useState('')

  const filtered = clients.filter(c => 
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

  return (
    <Card>
      <CardHeader>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o teléfono..." 
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
                <TableHead>Cliente / Dirección</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Préstamos</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => {
                const activeLoans = (client.loans || []).filter((l: any) => l.status === 'active')
                const totalDebt = activeLoans.reduce((acc: number, l: any) => acc + (l.remaining_balance || 0), 0)

                return (
                  <TableRow key={client.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{client.full_name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {client.address || 'Sin dirección'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm flex items-center gap-2 text-slate-600">
                        <Phone className="h-3 w-3" /> {client.phone || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activeLoans.length > 0 ? "default" : "outline"} className="font-medium">
                        {activeLoans.length} activos
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${totalDebt > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {formatCurrency(totalDebt)}
                      </span>
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

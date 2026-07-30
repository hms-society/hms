import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/shadcn/pagination'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useClientsQuery } from './use-clients-query'
import { useMaskPhone } from '@/ui/shared/hooks/use-mask-phone'
import { useMaskTaxId } from '@/ui/shared/hooks/use-mask-tax-id'

export const Route = createFileRoute('/atendimento/clientes/')({
  component: ClientesListPage,
})

type ClientStatus = 'Cliente' | 'Interessado' | 'Potencial'

const STATUS_STYLES: Record<ClientStatus, { badge: string; avatar: string }> = {
  Cliente: {
    badge: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    avatar: 'bg-emerald-100 text-emerald-800',
  },
  Interessado: {
    badge: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    avatar: 'bg-amber-100 text-amber-800',
  },
  Potencial: {
    badge: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    avatar: 'bg-purple-100 text-purple-800',
  },
}

const ORIGIN_LABELS: Record<string, string> = {
  direct: 'Direta HMS',
  referral: 'Indicação',
  website: 'Site',
  social_media: 'Campanha',
  other: 'Outro',
}

function getInitials(name: string) {
  if (!name) return 'UN'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function ClientesListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('status')
  const [origin, setOrigin] = useState('origem')
  const [responsavel, setResponsavel] = useState('responsavel')
  const limit = 20

  const { data, isLoading } = useClientsQuery({ page, limit, search })
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()

  const backendClients = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const filteredClients = backendClients.filter((client: any) => {
    const matchesStatus = status === 'status' || client.status.toLowerCase() === status

    const clientOriginLabel = ORIGIN_LABELS[client.origin] || client.origin || 'Direta HMS'
    
    const matchesOrigin =
      origin === 'origem' ||
      (origin === 'direta' && clientOriginLabel === 'Direta HMS') ||
      (origin === 'indicação' && clientOriginLabel === 'Indicação') ||
      (origin === 'campanha' && clientOriginLabel === 'Campanha') ||
      (origin === 'via-terceiro' && clientOriginLabel === 'Via terceiro') ||
      (origin === 'retorno' && clientOriginLabel === 'Retorno') ||
      (origin === 'outro' && clientOriginLabel === 'Outro')

    return matchesStatus && matchesOrigin
  })

  const handlePreviousPage = (e: React.MouseEvent) => {
    e.preventDefault()
    if (page > 1) setPage((p) => p - 1)
  }

  const handleNextPage = (e: React.MouseEvent) => {
    e.preventDefault()
    if (page < totalPages) setPage((p) => p + 1)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">{total} cadastros</p>
        </div>
        <Button className="bg-[#387F75] text-white hover:bg-[#387F75]/90 rounded-full px-6">
          <Icon name="plus" />
          Novo cliente
        </Button>
      </div>

      <div className="relative">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Buscar por nome, CPF, CNPJ ou telefone..."
          className="pl-9 bg-card border-border/60 shadow-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground mr-1">Filtros</span>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] bg-card h-9 border-border/60 shadow-sm">
            <SelectValue placeholder="Status relacional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Status relacional</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="interessado">Interessado</SelectItem>
            <SelectItem value="potencial">Potencial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={responsavel} onValueChange={setResponsavel}>
          <SelectTrigger className="w-[160px] bg-card h-9 border-border/60 shadow-sm">
            <SelectValue placeholder="Responsável HMS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="responsavel">Responsável HMS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={origin} onValueChange={setOrigin}>
          <SelectTrigger className="w-[120px] bg-card h-9 border-border/60 shadow-sm">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="origem">Origem</SelectItem>
            <SelectItem value="direta">Direta HMS</SelectItem>
            <SelectItem value="indicação">Indicação</SelectItem>
            <SelectItem value="campanha">Campanha</SelectItem>
            <SelectItem value="via-terceiro">Via terceiro</SelectItem>
            <SelectItem value="retorno">Retorno</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] font-medium text-muted-foreground">Nome</TableHead>
              <TableHead className="font-medium text-muted-foreground">CPF / CNPJ</TableHead>
              <TableHead className="font-medium text-muted-foreground">Telefone</TableHead>
              <TableHead className="font-medium text-muted-foreground">Status</TableHead>
              <TableHead className="font-medium text-muted-foreground">Intakes</TableHead>
              <TableHead className="font-medium text-muted-foreground">Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Carregando clientes...
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client: any) => {
                const displayName = client.name || client.legalName || 'Nome não informado'
                const statusStyle = STATUS_STYLES[client.status as ClientStatus] || STATUS_STYLES.Potencial
                const displayOrigin = ORIGIN_LABELS[client.origin] || client.origin || 'Direta HMS'

                return (
                  <TableRow key={client.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className={`size-8 ${statusStyle.avatar}`}>
                          <AvatarFallback className="bg-transparent font-medium text-xs">
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground font-semibold">{displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.taxId?.value ? maskTaxId(client.taxId.value) : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{client.phone ? maskPhone(client.phone) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-transparent shadow-none font-medium ${statusStyle.badge}`}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.intakesCount}</TableCell>
                    <TableCell className="text-muted-foreground">{displayOrigin}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Exibindo {filteredClients.length > 0 ? (page - 1) * limit + 1 : 0}-{(page - 1) * limit + filteredClients.length} de {total}
        </p>
        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={handlePreviousPage}
                text="" 
                className={`size-9 p-0 border border-border/60 bg-card text-muted-foreground hover:bg-muted ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`} 
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive className="size-9 border border-[#387F75] bg-[#387F75]/10 text-[#387F75] hover:bg-[#387F75]/20">
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={handleNextPage}
                text="" 
                className={`size-9 p-0 border border-border/60 bg-card text-muted-foreground hover:bg-muted ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
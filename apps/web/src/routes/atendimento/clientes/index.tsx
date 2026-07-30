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
import { useState } from 'react'

export const Route = createFileRoute('/atendimento/clientes/')({
  component: ClientesListPage,
})

type ClientStatus = 'Cliente' | 'Interessado' | 'Potencial'

interface ClientMock {
  id: string
  initials: string
  name: string
  document: string
  phone: string
  status: ClientStatus
  intakes: number
  origin: string
}

const MOCK_CLIENTS: ClientMock[] = [
  { id: '1', initials: 'MA', name: 'Maria Aparecida dos Santos', document: '123.456.789-00', phone: '(12) 98765-4321', status: 'Cliente', intakes: 2, origin: 'Via terceiro' },
  { id: '2', initials: 'JC', name: 'José Carlos Oliveira', document: '987.654.321-00', phone: '(11) 91234-5678', status: 'Interessado', intakes: 1, origin: 'Indicação' },
  { id: '3', initials: 'AF', name: 'Ana Ferreira Lima', document: '456.789.123-00', phone: '(12) 99876-5432', status: 'Cliente', intakes: 3, origin: 'Via terceiro' },
  { id: '4', initials: 'RS', name: 'Roberto da Silva Pereira', document: '321.654.987-00', phone: '(12) 97654-3210', status: 'Potencial', intakes: 1, origin: 'Direta HMS' },
  { id: '5', initials: 'CP', name: 'Cláudia Pereira Nascimento', document: '654.321.987-00', phone: '(11) 98321-6547', status: 'Interessado', intakes: 1, origin: 'Campanha' },
  { id: '6', initials: 'LP', name: 'Luiz Paulo Mendes', document: '789.123.456-00', phone: '(12) 93456-7890', status: 'Cliente', intakes: 4, origin: 'Via terceiro' },
  { id: '7', initials: 'FS', name: 'Francisca Souza Almeida', document: '147.258.369-00', phone: '(11) 97890-1234', status: 'Interessado', intakes: 1, origin: 'Direta HMS' },
]

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

function ClientesListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('status')
  const [origin, setOrigin] = useState('origem')
  const [responsavel, setResponsavel] = useState('responsavel')

  const filteredClients = MOCK_CLIENTS.filter((client) => {
  const matchesSearch =
    search === '' ||
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.document.includes(search) ||
    client.phone.includes(search)

  const matchesStatus =
    status === 'status' ||
    client.status.toLowerCase() === status

  const matchesOrigin =
    origin === 'origem' ||
    (origin === 'direta' && client.origin === 'Direta HMS') ||
    (origin === 'via-terceiro' && client.origin === 'Via terceiro') ||
    (origin === 'indicação' && client.origin === 'Indicação') ||
    (origin === 'campanha' && client.origin === 'Campanha')

  return matchesSearch && matchesStatus && matchesOrigin
})


  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 mt-25">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">147 cadastros</p>
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
          onChange={(e) => setSearch(e.target.value)}
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
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className={`size-8 ${STATUS_STYLES[client.status].avatar}`}>
                      <AvatarFallback className="bg-transparent font-medium text-xs">
                        {client.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground font-semibold">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.document}</TableCell>
                <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`border-transparent shadow-none font-medium ${STATUS_STYLES[client.status].badge}`}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.intakes}</TableCell>
                <TableCell className="text-muted-foreground">{client.origin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Exibindo 1-20 de 147
        </p>
        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" text="" className="size-9 p-0 border border-border/60 bg-card text-muted-foreground hover:bg-muted" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive className="size-9 border border-[#387F75] bg-[#387F75]/10 text-[#387F75] hover:bg-[#387F75]/20">
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" className="size-9 border border-border/60 bg-card text-muted-foreground hover:bg-muted">
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" className="size-9 border border-border/60 bg-card text-muted-foreground hover:bg-muted">
                3
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" text="" className="size-9 p-0 border border-border/60 bg-card text-muted-foreground hover:bg-muted" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
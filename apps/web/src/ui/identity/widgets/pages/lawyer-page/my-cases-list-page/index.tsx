import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useMyCasesListPage } from './use-my-cases-list-page'

export const LawyerCasesListPage = () => {
  const {
    area,
    cases,
    handleAreaChange,
    handleSearchChange,
    handleStatusChange,
    isCasesError,
    isLoadingCases,
    search,
    status,
    total,
  } = useMyCasesListPage()

  return (
    <div className='mt-12 flex w-full flex-col gap-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='font-serif text-2xl font-semibold text-foreground'>
            Meus casos
          </h1>
          <p className='text-sm text-muted-foreground'>
            {total} casos disponíveis para sua equipe
          </p>
        </div>
      </div>

      <div className='relative'>
        <Icon
          name='search'
          className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
        />
        <Input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder='Buscar por caso, cliente, código ou área jurídica...'
          className='border-border/60 bg-card pl-9 shadow-sm'
        />
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <span className='mr-1 text-sm text-muted-foreground'>Filtros</span>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className='h-9 w-[180px] border-border/60 bg-card shadow-sm'>
            <SelectValue placeholder='Status do caso' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='todos'>Todos os status</SelectItem>
            <SelectItem value='Em formação'>Em formação</SelectItem>
            <SelectItem value='Em andamento'>Em andamento</SelectItem>
            <SelectItem value='Aguardando cliente'>Aguardando cliente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={area} onValueChange={handleAreaChange}>
          <SelectTrigger className='h-9 w-[210px] border-border/60 bg-card shadow-sm'>
            <SelectValue placeholder='Área jurídica' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='todas'>Todas as áreas</SelectItem>
            <SelectItem value='Direito Previdenciário'>Direito Previdenciário</SelectItem>
            <SelectItem value='Direito Tributário'>Direito Tributário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='w-[320px] font-medium text-muted-foreground'>
                Caso
              </TableHead>
              <TableHead className='font-medium text-muted-foreground'>Cliente</TableHead>
              <TableHead className='font-medium text-muted-foreground'>Status</TableHead>
              <TableHead className='font-medium text-muted-foreground'>
                Checklist
              </TableHead>
              <TableHead className='font-medium text-muted-foreground'>Equipe</TableHead>
              <TableHead className='font-medium text-muted-foreground'>
                Próxima ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingCases ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                  Carregando casos...
                </TableCell>
              </TableRow>
            ) : isCasesError ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                  Não foi possível carregar os casos.
                </TableCell>
              </TableRow>
            ) : cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                  Nenhum caso encontrado.
                </TableCell>
              </TableRow>
            ) : (
              cases.map((caseItem) => (
                <TableRow key={caseItem.id} className='cursor-pointer'>
                  <TableCell>
                    <Anchor
                      route='lawyerCaseDetails'
                      params={{ caseId: caseItem.id }}
                      className='flex flex-col gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    >
                      <span className='font-semibold text-foreground'>
                        {caseItem.title}
                      </span>
                      <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Icon name='tag' className='size-3' />
                        {caseItem.publicCode} · {caseItem.legalArea}
                      </span>
                    </Anchor>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {caseItem.clientName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className={`border-transparent font-medium shadow-none ${caseItem.statusStyle}`}
                    >
                      {caseItem.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    <span className='flex items-center gap-2'>
                      <Icon name={caseItem.progress.icon} className='size-4' />
                      {caseItem.progress.completedCount}/{caseItem.progress.totalCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <div className='flex -space-x-1.5'>
                        {caseItem.team.map((member) => (
                          <Avatar
                            key={`${caseItem.id}-${member.collaboratorId}`}
                            className='size-7 border-2 border-card'
                          >
                            <AvatarFallback
                              className={`${member.className} text-[10px]`}
                              title={`${member.name} - ${member.role}`}
                            >
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className='sr-only'>{caseItem.displayTeam}</span>
                    </div>
                  </TableCell>
                  <TableCell className='max-w-[260px] text-muted-foreground'>
                    <div className='flex flex-col gap-1'>
                      <span className='truncate'>{caseItem.nextAction}</span>
                      <span className='text-xs'>{caseItem.updatedAt}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

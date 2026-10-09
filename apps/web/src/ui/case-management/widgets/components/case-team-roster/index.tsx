import { CaseMemberRole } from '@hms/core/case-management/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useCaseTeamRoster } from './use-case-team-roster'

export type CaseTeamRosterProps = {
  caseId: string
}

export const CaseTeamRoster = ({ caseId }: CaseTeamRosterProps) => {
  const { error, handleRetry, isLoading, members, total } = useCaseTeamRoster(caseId)

  return (
    <section className='min-w-0 space-y-4' aria-labelledby='case-team-roster-title'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 id='case-team-roster-title' className='font-serif text-lg font-semibold'>
            Equipe do caso
          </h2>
          <p className='text-sm text-muted-foreground'>
            Integrantes com acesso ativo e seus níveis de atuação.
          </p>
        </div>
        <Badge variant='secondary' className='rounded-full'>
          {total} {total === 1 ? 'integrante ativo' : 'integrantes ativos'}
        </Badge>
      </header>

      {error ? (
        <div
          className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4'
          role='alert'
        >
          <p className='text-sm text-foreground'>
            Não foi possível carregar a equipe deste caso.
          </p>
          <Button type='button' variant='outline' onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className='overflow-x-auto rounded-xl border border-border bg-card'>
          <Table className='min-w-[540px]'>
            <TableHeader className='bg-secondary text-secondary-foreground'>
              <TableRow>
                <TableHead>Integrante</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status do vínculo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className='py-8 text-center text-muted-foreground'
                  >
                    Carregando equipe…
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className='py-8 text-center text-muted-foreground'
                  >
                    Nenhum integrante ativo foi encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.membershipId}>
                    <TableCell>
                      <div className='font-medium text-foreground'>
                        {member.professionalName}
                      </div>
                      <div className='text-sm text-muted-foreground'>{member.email}</div>
                    </TableCell>
                    <TableCell>
                      {member.role === CaseMemberRole.Manager ? 'Gestor' : 'Colaborador'}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary' className='rounded-full'>
                        Ativo
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}

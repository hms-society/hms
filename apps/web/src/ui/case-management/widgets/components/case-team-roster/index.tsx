import { useRef } from 'react'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'

import { MemberActions } from '@/ui/case-management/widgets/components/case-team/team-member-row/member-actions'
import { TeamMutationDialog } from '@/ui/case-management/widgets/components/case-team/team-mutation-dialog'
import { CaseTeamMemberSelector } from '@/ui/case-management/widgets/components/case-team-member-selector'
import { Icon } from '@/ui/shared/widgets/components/icon'
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
  const addMemberButtonRef = useRef<HTMLButtonElement>(null)
  const {
    canManageActiveTeam,
    caseTeam,
    error,
    handleBeginRemoval,
    handleBeginRoleChange,
    handleCloseSelector,
    handleConfirmMutation,
    handleOpenSelector,
    handlePendingMutationOpenChange,
    handleReasonChange,
    handleRetry,
    handleSelectCandidate,
    hasVersionConflict,
    isLoading,
    isMutationPending,
    isSelectorOpen,
    members,
    mutationError,
    pendingMutation,
    reason,
    total,
  } = useCaseTeamRoster(caseId)

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
        <div className='flex flex-wrap items-center gap-3'>
          <Badge variant='secondary' className='rounded-full'>
            {total} {total === 1 ? 'integrante ativo' : 'integrantes ativos'}
          </Badge>
          {canManageActiveTeam && (
            <Button
              ref={addMemberButtonRef}
              type='button'
              className='rounded-full'
              onClick={handleOpenSelector}
            >
              <Icon name='list-plus' className='size-4' /> Adicionar colaborador
            </Button>
          )}
        </div>
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
          <Table className='min-w-[620px]'>
            <TableHeader className='bg-secondary text-secondary-foreground'>
              <TableRow>
                <TableHead>Integrante</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status do vínculo</TableHead>
                <TableHead className='w-12'>
                  <span className='sr-only'>Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-8 text-center text-muted-foreground'
                  >
                    Carregando equipe…
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
                    <TableCell>
                      <MemberActions
                        member={member}
                        canManage={canManageActiveTeam}
                        isLastManager={
                          member.role === CaseMemberRole.Manager &&
                          caseTeam?.activeManagerCount === 1
                        }
                        onChangeRole={() => handleBeginRoleChange(member)}
                        onRemove={() => handleBeginRemoval(member)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <CaseTeamMemberSelector
        open={canManageActiveTeam && isSelectorOpen}
        caseId={caseId}
        triggerRef={addMemberButtonRef}
        onClose={handleCloseSelector}
        onSelect={handleSelectCandidate}
      />
      <TeamMutationDialog
        caseTeam={canManageActiveTeam ? caseTeam : undefined}
        mutation={canManageActiveTeam ? pendingMutation : null}
        reason={reason}
        error={mutationError}
        hasVersionConflict={hasVersionConflict}
        isPending={isMutationPending}
        onOpenChange={handlePendingMutationOpenChange}
        onReasonChange={handleReasonChange}
        onConfirm={() => void handleConfirmMutation()}
      />
    </section>
  )
}

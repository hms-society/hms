import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type { CaseTeam } from '@hms/core/case-management/domain/structures'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { MutationActions } from './mutation-actions'
import { MutationDescription } from './mutation-description'
import { MutationFeedback } from './mutation-feedback'
import type { PendingMutation } from '../use-case-team-mutation'

export type TeamMutationDialogProps = {
  caseTeam?: CaseTeam
  mutation: PendingMutation | null
  reason: string
  error: string | null
  hasVersionConflict: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onReasonChange: (reason: string) => void
  onConfirm: () => void
}

function getMutationTitle(mutation: PendingMutation) {
  if (mutation.kind === 'add') return 'Adicionar à equipe'
  if (mutation.kind === 'role') return 'Alterar nível de acesso'
  return 'Remover do caso'
}

export const TeamMutationDialog = (props: TeamMutationDialogProps) => {
  const mutation = props.mutation
  const isLastManagerRemoval = Boolean(
    mutation?.kind === 'remove' &&
      mutation.member.role === CaseMemberRole.Manager &&
      props.caseTeam?.activeManagerCount === 1,
  )
  const showReason =
    props.caseTeam?.requiresAdministrativeReason === true && mutation?.kind !== 'add'
  const reasonLength = props.reason.trim().length
  const isReasonRequired = mutation?.kind === 'remove'
  const isInvalidReason = showReason && isReasonRequired && reasonLength === 0
  const isRemove = mutation?.kind === 'remove'

  return (
    <Dialog open={Boolean(mutation)} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl sm:max-w-[480px]'>
        {mutation && (
          <DialogHeader>
            <DialogTitle className='font-serif text-xl'>
              {getMutationTitle(mutation)}
            </DialogTitle>
            <DialogDescription>
              <MutationDescription mutation={mutation} />
            </DialogDescription>
          </DialogHeader>
        )}
        {mutation?.kind !== 'remove' && mutation && (
          <p className='rounded-lg bg-secondary px-3 py-2 text-sm text-foreground'>
            Novo nível:{' '}
            {mutation.role === CaseMemberRole.Manager ? 'Gestor' : 'Colaborador'}
          </p>
        )}
        <MutationFeedback
          showReason={showReason}
          isReasonRequired={isReasonRequired}
          reason={props.reason}
          error={props.error}
          hasVersionConflict={props.hasVersionConflict}
          isLastManagerRemoval={isLastManagerRemoval}
          onReasonChange={props.onReasonChange}
        />
        <MutationActions
          isPending={props.isPending}
          isRemove={Boolean(isRemove)}
          isDisabled={props.isPending || isLastManagerRemoval || isInvalidReason}
          onCancel={() => props.onOpenChange(false)}
          onConfirm={props.onConfirm}
        />
      </DialogContent>
    </Dialog>
  )
}

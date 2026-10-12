import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type { PendingMutation } from '../../use-case-team-mutation'

export type MutationDescriptionProps = {
  mutation: PendingMutation
}

export const MutationDescription = ({ mutation }: MutationDescriptionProps) => {
  const memberName =
    mutation.kind === 'add'
      ? mutation.candidate.professionalName
      : mutation.member.professionalName
  const role = mutation.kind === 'remove' ? undefined : mutation.role
  const action =
    mutation.kind === 'add'
      ? 'será incluído como'
      : mutation.kind === 'role'
        ? 'passará a ser'
        : 'perderá o acesso futuro a este caso.'

  return (
    <>
      {memberName} {action}{' '}
      {role && (role === CaseMemberRole.Manager ? 'Gestor.' : 'Colaborador.')}
    </>
  )
}

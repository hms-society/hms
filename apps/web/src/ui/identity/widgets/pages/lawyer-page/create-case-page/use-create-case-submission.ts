import type { CreateCaseData } from '@hms/validation/case-management'
import type { CaseEligibleCollaborator } from '@hms/core/case-management/domain/structures'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRef } from 'react'
import { toast } from 'sonner'
import { useCreateCaseAction } from '@/ui/case-management/hooks/use-create-case-action'

function validateInitialManager(
  data: CreateCaseData,
  manager: CaseEligibleCollaborator | null,
) {
  return Boolean(
    manager &&
      manager.profile === CollaboratorProfile.Lawyer &&
      manager.status === UserStatus.Active &&
      data.initialManagerCollaboratorId === manager.collaboratorId,
  )
}

export function useCreateCaseSubmission() {
  const { navigateTo } = useNavigation()
  const { createCase, isCreatingCase } = useCreateCaseAction()
  const lastAttempt = useRef<{
    fingerprint: string
    operationId: string
  } | null>(null)

  async function onSubmit(
    data: CreateCaseData,
    manager: CaseEligibleCollaborator | null,
  ) {
    if (!data.intakeId) {
      toast.error(
        'Este cliente não possui uma triagem (Intake) disponível para abertura de caso.',
      )
      return
    }
    if (!validateInitialManager(data, manager)) {
      toast.error('Selecione um Advogado ativo como Gestor inicial do caso.')
      return
    }
    await submitCase(data, createCase, navigateTo, lastAttempt)
  }

  return { isCreatingCase, onSubmit }
}

async function submitCase(
  data: CreateCaseData,
  createCase: ReturnType<typeof useCreateCaseAction>['createCase'],
  navigateTo: ReturnType<typeof useNavigation>['navigateTo'],
  lastAttempt: { current: { fingerprint: string; operationId: string } | null },
) {
  const { operationId: _operationId, ...creationData } = data
  const fingerprint = JSON.stringify(creationData)
  const operationId =
    lastAttempt.current?.fingerprint === fingerprint
      ? lastAttempt.current.operationId
      : crypto.randomUUID()
  lastAttempt.current = { fingerprint, operationId }
  try {
    await createCase({ ...creationData, operationId })
    toast.success('Caso criado com sucesso!')
    await navigateTo('lawyerCases')
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : 'Erro ao criar caso. Verifique se o Intake já foi utilizado.',
    )
  }
}

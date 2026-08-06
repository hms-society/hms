import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { CollaboratorListQuery } from '@hms/core/identity/domain/structures'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import {
  createParser,
  parseAsStringLiteral,
  useQueryStates,
  type inferParserType,
} from 'nuqs'
import { toast } from 'sonner'
import { useEffect, useState, type MouseEvent } from 'react'

import type { IconName } from '@/ui/shared/widgets/components/icon'

import { useCollaboratorActions } from '../../../hooks/use-collaborator-actions'
import {
  COLLABORATOR_PROFILE_LABELS,
  COLLABORATOR_STATUS_LABELS,
  formatCollaboratorLastAccess,
} from './collaborators-page-constants'
import {
  useCollaboratorJobTitlesQuery,
  useCollaboratorsQuery,
} from './use-collaborators-query'

export type CollaboratorAction = {
  kind: 'resend' | 'deactivate' | 'reactivate' | 'cancel-invitation' | 'remove'
  collaborator: CollaboratorSummary
}

const parseAsPositiveInteger = createParser<number>({
  parse: parsePositiveInteger,
  serialize: serializePositiveInteger,
})

const COLLABORATOR_SEARCH_PARAMS = {
  search: createParser<string>({
    parse: parseTrimmedString,
    serialize: serializeTrimmedString,
  }),
  profile: parseAsStringLiteral([
    CollaboratorProfile.Admin,
    CollaboratorProfile.Attendant,
    CollaboratorProfile.Lawyer,
    CollaboratorProfile.Paralegal,
    CollaboratorProfile.Supervisor,
    CollaboratorProfile.Client,
  ] as const),
  jobTitle: createParser<string>({
    parse: parseTrimmedString,
    serialize: serializeTrimmedString,
  }),
  status: parseAsStringLiteral([
    UserStatus.Active,
    UserStatus.Invited,
    UserStatus.Disabled,
  ] as const),
  page: parseAsPositiveInteger.withDefault(1),
  pageSize: parseAsPositiveInteger.withDefault(20),
}

type CollaboratorSearchParams = inferParserType<typeof COLLABORATOR_SEARCH_PARAMS>

function parsePositiveInteger(value: string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function serializePositiveInteger(value: number) {
  return String(value)
}

function parseTrimmedString(value: string) {
  const parsed = value.trim()
  return parsed || null
}

function serializeTrimmedString(value: string) {
  return value.trim()
}

export type CollaboratorsPageOptions = {
  successMessage?: string
}

export function useCollaboratorsPage({ successMessage }: CollaboratorsPageOptions = {}) {
  const [searchParams, setSearchParams] = useQueryStates(COLLABORATOR_SEARCH_PARAMS, {
    history: 'push',
  })
  const query: CollaboratorListQuery = {
    search: searchParams.search ?? undefined,
    profile: searchParams.profile ?? undefined,
    jobTitle: searchParams.jobTitle ?? undefined,
    status: searchParams.status ?? undefined,
    page: searchParams.page,
    pageSize: searchParams.pageSize,
  }
  const { collaboratorsPage, collaboratorsPageError, isLoadingCollaborators, refetch } =
    useCollaboratorsQuery(query)
  const { jobTitles } = useCollaboratorJobTitlesQuery()
  const [selectedAction, setSelectedAction] = useState<CollaboratorAction>()
  const [selectedEditCollaborator, setSelectedEditCollaborator] =
    useState<CollaboratorSummary>()
  const {
    resendInvitation,
    isResendingInvitation,
    resendInvitationError,
    resetResendInvitation,
    deactivateCollaborator,
    isDeactivatingCollaborator,
    deactivateCollaboratorError,
    resetDeactivateCollaborator,
    reactivateCollaborator,
    isReactivatingCollaborator,
    reactivateCollaboratorError,
    resetReactivateCollaborator,
    cancelCollaboratorInvitation,
    isCancellingCollaboratorInvitation,
    cancelCollaboratorInvitationError,
    resetCancelCollaboratorInvitation,
    removeCollaborator,
    isRemovingCollaborator,
    removeCollaboratorError,
    resetRemoveCollaborator,
  } = useCollaboratorActions()
  const isActionPending =
    isResendingInvitation ||
    isDeactivatingCollaborator ||
    isReactivatingCollaborator ||
    isCancellingCollaboratorInvitation ||
    isRemovingCollaborator
  const actionError =
    selectedAction?.kind === 'resend'
      ? resendInvitationError
      : selectedAction?.kind === 'deactivate'
        ? deactivateCollaboratorError
        : selectedAction?.kind === 'reactivate'
          ? reactivateCollaboratorError
          : selectedAction?.kind === 'cancel-invitation'
            ? cancelCollaboratorInvitationError
            : selectedAction?.kind === 'remove'
              ? removeCollaboratorError
              : undefined
  const page = collaboratorsPage?.page ?? query.page ?? 1
  const totalPages = collaboratorsPage?.totalPages ?? 0

  function isDestructiveCollaboratorAction(action?: CollaboratorAction) {
    return (
      action?.kind === 'deactivate' ||
      action?.kind === 'cancel-invitation' ||
      action?.kind === 'remove'
    )
  }

  function getCollaboratorActionIcon(action?: CollaboratorAction): IconName {
    if (action?.kind === 'resend') return 'mail'
    if (action?.kind === 'reactivate') return 'refresh-cw'
    if (action?.kind === 'cancel-invitation') return 'x'
    return 'user-x'
  }

  function getCollaboratorActionTitle(action?: CollaboratorAction) {
    if (action?.kind === 'resend') return 'Reenviar convite?'
    if (action?.kind === 'reactivate') return 'Reativar colaborador?'
    if (action?.kind === 'cancel-invitation') return 'Cancelar convite?'
    if (action?.kind === 'remove') return 'Remover colaborador?'
    return 'Inativar colaborador?'
  }

  function getCollaboratorActionDescription(action?: CollaboratorAction) {
    if (!action) return ''
    if (action.kind === 'resend') {
      return 'Um novo e-mail de acesso será enviado para este colaborador.'
    }
    if (action.kind === 'reactivate') {
      return `O acesso de ${action.collaborator.professionalName} à HMS será reativado.`
    }
    if (action.kind === 'cancel-invitation') {
      return `O convite de ${action.collaborator.professionalName} será invalidado e a conta ficará disponível para remoção.`
    }
    if (action.kind === 'remove') {
      return `A conta de ${action.collaborator.professionalName} e o convite cancelado serão removidos permanentemente.`
    }
    return `Essa ação suspenderá o acesso de ${action.collaborator.professionalName} à HMS.`
  }

  function getCollaboratorActionButtonLabel(action?: CollaboratorAction) {
    if (action?.kind === 'resend') return 'Reenviar convite'
    if (action?.kind === 'reactivate') return 'Reativar colaborador'
    if (action?.kind === 'cancel-invitation') return 'Cancelar convite'
    if (action?.kind === 'remove') return 'Remover colaborador'
    return 'Inativar colaborador'
  }

  useEffect(
    function notifySuccessMessage() {
      if (successMessage) toast.success(successMessage)
    },
    [successMessage],
  )

  function handleUpdateSearch(patch: Partial<CollaboratorListQuery>) {
    const nextParams: Partial<CollaboratorSearchParams> = {
      page: patch.page ?? 1,
    }

    if ('search' in patch) nextParams.search = patch.search ?? null
    if ('profile' in patch) nextParams.profile = patch.profile ?? null
    if ('jobTitle' in patch) nextParams.jobTitle = patch.jobTitle ?? null
    if ('status' in patch) nextParams.status = patch.status ?? null
    if ('pageSize' in patch) nextParams.pageSize = patch.pageSize ?? 20

    return setSearchParams(nextParams)
  }

  function handleClearFilters() {
    return setSearchParams({
      search: null,
      profile: null,
      jobTitle: null,
      status: null,
      page: null,
      pageSize: null,
    })
  }

  function handleOpenAction(
    kind: CollaboratorAction['kind'],
    collaborator: CollaboratorSummary,
  ) {
    if (
      kind === 'remove' &&
      (collaborator.status !== UserStatus.Disabled || collaborator.lastAccessAt)
    ) {
      return
    }

    if (kind === 'resend') resetResendInvitation()
    if (kind === 'deactivate') resetDeactivateCollaborator()
    if (kind === 'reactivate') resetReactivateCollaborator()
    if (kind === 'cancel-invitation') resetCancelCollaboratorInvitation()
    if (kind === 'remove') resetRemoveCollaborator()
    setSelectedAction({ kind, collaborator })
  }

  function handleOpenEdit(collaborator: CollaboratorSummary) {
    setSelectedEditCollaborator(collaborator)
  }

  function handleEditDialogOpenChange(open: boolean) {
    if (!open) setSelectedEditCollaborator(undefined)
  }

  function handleEditSuccess() {
    setSelectedEditCollaborator(undefined)
    toast.success('Colaborador atualizado com sucesso.')
  }

  async function handleConfirmAction(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!selectedAction || isActionPending) return

    if (selectedAction.kind === 'resend') {
      await resendInvitation(selectedAction.collaborator.collaboratorId)
      toast.success('Convite reenviado com sucesso.')
    } else if (selectedAction.kind === 'deactivate') {
      await deactivateCollaborator(selectedAction.collaborator.collaboratorId)
      toast.success('Colaborador inativado com sucesso.')
    } else if (selectedAction.kind === 'reactivate') {
      await reactivateCollaborator(selectedAction.collaborator.collaboratorId)
      toast.success('Colaborador reativado com sucesso.')
    } else if (selectedAction.kind === 'cancel-invitation') {
      await cancelCollaboratorInvitation(selectedAction.collaborator.collaboratorId)
      toast.success('Convite cancelado com sucesso.')
    } else {
      await removeCollaborator(selectedAction.collaborator.collaboratorId)
      toast.success('Colaborador removido com sucesso.')
    }

    setSelectedAction(undefined)
  }

  function handleActionDialogOpenChange(open: boolean) {
    if (!open && !isActionPending) setSelectedAction(undefined)
  }

  return {
    actionError,
    collaboratorsPage,
    collaboratorsPageError,
    isActionPending,
    isLoadingCollaborators,
    jobTitles,
    page,
    profileLabels: COLLABORATOR_PROFILE_LABELS,
    query,
    selectedAction,
    selectedEditCollaborator,
    statusLabels: COLLABORATOR_STATUS_LABELS,
    totalPages,
    refetch,
    formatCollaboratorLastAccess,
    getCollaboratorActionButtonLabel,
    getCollaboratorActionDescription,
    getCollaboratorActionIcon,
    getCollaboratorActionTitle,
    isDestructiveCollaboratorAction,
    handleActionDialogOpenChange,
    handleClearFilters,
    handleConfirmAction,
    handleEditDialogOpenChange,
    handleEditSuccess,
    handleOpenEdit,
    handleOpenAction,
    handleUpdateSearch,
  }
}

export type CollaboratorsPageController = ReturnType<typeof useCollaboratorsPage>

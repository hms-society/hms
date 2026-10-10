import { Dialog, DialogContent } from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import type { ReactNode, RefObject } from 'react'
import { CandidateFilters } from './candidate-filters'
import { CandidatePagination } from './candidate-pagination'
import { CandidateResults } from './candidate-results'
import { CandidateResultStatus } from './candidate-result-status'
import { CandidateRoleSelect } from './candidate-role-select'
import { SelectorDialogHeading } from './selector-dialog-heading'
import { SelectorFooter } from './selector-footer'
import type { CaseTeamMemberSelectorProps } from './types/case-team-member-selector-props'
import { useCaseTeamMemberSelector } from './use-case-team-member-selector'

type CaseTeamMemberSelectorState = ReturnType<typeof useCaseTeamMemberSelector>

const SelectorFilters = ({ state }: { state: CaseTeamMemberSelectorState }) => (
  <div className='shrink-0 space-y-4'>
    <Input
      aria-label='Buscar colaborador por nome'
      placeholder='Buscar colaborador por nome'
      value={state.search}
      onChange={(event) => state.handleSearchChange(event.target.value)}
    />
    {!state.isSingleRole && (
      <CandidateRoleSelect
        role={state.role}
        allowedRoles={state.allowedRoles}
        onChange={state.handleRoleChange}
      />
    )}
    <CandidateFilters
      profile={state.profile}
      requiredProfile={state.requiredProfile}
      onProfileChange={state.handleProfileChange}
    />
    <CandidateResultStatus
      total={state.caseTeamCandidates?.total ?? 0}
      isLoading={state.isLoadingCaseTeamCandidates}
      onClear={state.handleClearFilters}
    />
  </div>
)

const SelectorCandidateResults = ({ state }: { state: CaseTeamMemberSelectorState }) => (
  <div className='min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto'>
    <CandidateResults
      isError={Boolean(state.caseTeamCandidatesError)}
      isLoading={state.isLoadingCaseTeamCandidates}
      candidates={state.caseTeamCandidates?.items ?? []}
      selectedCollaboratorId={state.selectedCollaborator?.collaboratorId}
      getProfileLabel={state.getProfileLabel}
      onSelect={state.handleCollaboratorSelect}
      onRetry={() => void state.refetchCaseTeamCandidates()}
    />
    {state.caseTeamCandidates && state.caseTeamCandidates.totalPages > 1 && (
      <CandidatePagination
        page={state.page}
        totalPages={state.caseTeamCandidates.totalPages}
        onPrevious={state.handlePreviousPage}
        onNext={state.handleNextPage}
      />
    )}
    <p className='text-xs text-muted-foreground'>
      Somente pessoas ativas com perfil Advogado, Paralegal ou Supervisor são exibidas.
    </p>
  </div>
)

const SelectorDialogShell = ({
  open,
  onClose,
  triggerRef,
  children,
}: {
  open: boolean
  onClose: () => void
  triggerRef?: RefObject<HTMLButtonElement | null>
  children: ReactNode
}) => (
  <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
    <DialogContent
      className='flex h-[calc(100dvh_-_2rem)] max-h-[52rem] flex-col gap-4 overflow-hidden rounded-xl sm:max-w-[620px]'
      onCloseAutoFocus={(event) => {
        if (!triggerRef?.current) return
        event.preventDefault()
        triggerRef.current.focus()
      }}
    >
      {children}
    </DialogContent>
  </Dialog>
)

const SelectorContents = ({
  state,
  onClose,
}: {
  state: CaseTeamMemberSelectorState
  onClose: () => void
}) => (
  <>
    <SelectorDialogHeading />
    <SelectorFilters state={state} />
    <SelectorCandidateResults state={state} />
    <SelectorFooter
      isSelectionDisabled={
        !state.selectedCollaborator || state.isLoadingCaseTeamCandidates
      }
      onCancel={onClose}
      onConfirm={state.handleConfirmSelection}
    />
  </>
)

const SelectorState = ({ props }: { props: CaseTeamMemberSelectorProps }) => {
  const state = useCaseTeamMemberSelector(props)
  return <SelectorContents state={state} onClose={props.onClose} />
}

export const CaseTeamMemberSelector = (props: CaseTeamMemberSelectorProps) => (
  <SelectorDialogShell
    open={props.open}
    onClose={props.onClose}
    triggerRef={props.triggerRef}
  >
    <SelectorState props={props} />
  </SelectorDialogShell>
)

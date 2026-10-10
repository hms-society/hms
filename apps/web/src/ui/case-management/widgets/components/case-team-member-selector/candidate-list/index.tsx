import type { CaseEligibleCollaborator } from '@hms/core/case-management/domain/structures'

import { CandidateOption } from '../candidate-option'

export type CandidateListProps = {
  candidates: readonly CaseEligibleCollaborator[]
  isLoading: boolean
  isError: boolean
  selectedCollaboratorId?: string
  getProfileLabel: (profile: CaseEligibleCollaborator['profile']) => string
  onSelect: (candidate: CaseEligibleCollaborator) => void
}

export const CandidateList = ({
  candidates,
  isLoading,
  isError,
  selectedCollaboratorId,
  getProfileLabel,
  onSelect,
}: CandidateListProps) => (
  <div className='space-y-2'>
    {candidates.map((candidate) => (
      <CandidateOption
        key={candidate.collaboratorId}
        candidate={candidate}
        isSelected={selectedCollaboratorId === candidate.collaboratorId}
        getProfileLabel={getProfileLabel}
        onSelect={onSelect}
      />
    ))}
    {!isLoading && !isError && candidates.length === 0 && (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        Nenhum colaborador ativo encontrado para esses filtros.
      </p>
    )}
  </div>
)

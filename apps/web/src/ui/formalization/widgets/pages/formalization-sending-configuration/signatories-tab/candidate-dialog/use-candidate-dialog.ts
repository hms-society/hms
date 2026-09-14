import { useState } from 'react'

import { useFormalizationSignatureCandidatesQuery } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
import { COLLABORATOR_PROFILE_LABELS } from '@/ui/identity/widgets/pages/collaborators-page/collaborators-page-constants'

export type CandidateDialogProps = {
  formalizationId: string
  open: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (personId: string) => Promise<void>
}

export function useCandidateDialog({ formalizationId, open }: CandidateDialogProps) {
  const [search, setSearch] = useState('')
  const candidates = useFormalizationSignatureCandidatesQuery(
    formalizationId,
    { search, limit: 20 },
    open,
  )

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  return {
    ...candidates,
    candidates: candidates.candidates.map((candidate) => ({
      ...candidate,
      profileLabel: COLLABORATOR_PROFILE_LABELS[candidate.profile] ?? candidate.profile,
    })),
    handleSearchChange,
    search,
  }
}

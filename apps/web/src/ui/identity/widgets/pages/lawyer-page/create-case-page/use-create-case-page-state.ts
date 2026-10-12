import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCaseSchema, type CreateCaseData } from '@hms/validation/case-management'
import type { CaseEligibleCollaborator } from '@hms/core/case-management/domain/structures'

export function useCreateCasePageState() {
  const form = useForm<CreateCaseData>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      title: '',
      intakeId: '',
      legalAreaId: '',
      legalTopicId: '',
      description: '',
      initialManagerCollaboratorId: '',
      team: [],
      operationId: crypto.randomUUID(),
    },
  })
  const fieldArray = useFieldArray({ control: form.control, name: 'team' })
  const [intakeOpen, setIntakeOpen] = useState(false)
  const [intakeSearch, setIntakeSearch] = useState('')
  const [isManagerSelectorOpen, setIsManagerSelectorOpen] = useState(false)
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false)
  const [initialManager, setInitialManager] = useState<CaseEligibleCollaborator | null>(
    null,
  )
  const [teamMemberDetails, setTeamMemberDetails] = useState<CaseEligibleCollaborator[]>(
    [],
  )
  return {
    form,
    ...fieldArray,
    intakeOpen,
    intakeSearch,
    isManagerSelectorOpen,
    isTeamSelectorOpen,
    initialManager,
    teamMemberDetails,
    setIntakeOpen,
    setIntakeSearch,
    setIsManagerSelectorOpen,
    setIsTeamSelectorOpen,
    setInitialManager,
    setTeamMemberDetails,
  }
}

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCollaboratorLegalAreasQuery } from '@/ui/identity/hooks/use-collaborator-legal-areas-query'
import { useRegisterCollaboratorAction } from '../use-register-collaborator-action'

import {
  useCollaboratorRegisterDialog,
  type CollaboratorRegisterDialogProps,
} from '../use-collaborator-register-dialog'

vi.mock('@/ui/identity/hooks/use-collaborator-legal-areas-query', () => ({
  useCollaboratorLegalAreasQuery: vi.fn(),
}))

vi.mock('../use-register-collaborator-action', () => ({
  useRegisterCollaboratorAction: vi.fn(),
}))

const useLegalAreasMock = vi.mocked(useCollaboratorLegalAreasQuery)
const useRegisterMock = vi.mocked(useRegisterCollaboratorAction)

const areas = [
  {
    id: 'area-civil',
    name: 'Direito civil',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'area-labor',
    name: 'Direito trabalhista',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const dialogProps: CollaboratorRegisterDialogProps = {
  open: true,
  onOpenChange: vi.fn(),
  onSuccess: vi.fn(),
}

describe('useCollaboratorRegisterDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLegalAreasMock.mockReturnValue({
      legalAreas: areas,
      legalAreasError: null,
      isLoadingLegalAreas: false,
    })
    useRegisterMock.mockReturnValue({
      registerCollaborator: vi.fn().mockResolvedValue(undefined),
      isRegisteringCollaborator: false,
      registerCollaboratorError: null,
    })
  })

  it('creates and updates independent legal expertise groups', async () => {
    const { result } = renderHook(() => useCollaboratorRegisterDialog(dialogProps))

    act(() => result.current.handleProfileChange('lawyer'))
    await waitFor(() => expect(result.current.fields).toHaveLength(1))

    act(() => {
      result.current.handleAreaChange(0, 'area-civil')
      result.current.handleTopicsChange(0, ['topic-contracts'])
      result.current.handleAddExpertise()
    })

    expect(result.current.form.getValues('legalExpertises')).toEqual([
      { legalAreaId: 'area-civil', legalTopicIds: ['topic-contracts'] },
      { legalAreaId: '', legalTopicIds: [] },
    ])

    act(() => result.current.handleRemoveExpertise(1))

    expect(result.current.form.getValues('legalExpertises')).toEqual([
      { legalAreaId: 'area-civil', legalTopicIds: ['topic-contracts'] },
    ])
  })

  it('asks for confirmation before discarding expertise when changing profile', async () => {
    const { result } = renderHook(() => useCollaboratorRegisterDialog(dialogProps))

    act(() => result.current.handleProfileChange('lawyer'))
    await waitFor(() => expect(result.current.fields).toHaveLength(1))

    act(() => result.current.handleAreaChange(0, 'area-civil'))
    act(() => result.current.handleProfileChange('admin'))

    expect(result.current.profile).toBe('lawyer')
    expect(result.current.pendingProfile).toBe('admin')

    act(() => result.current.handleConfirmProfileChange())

    expect(result.current.profile).toBe('admin')
    expect(result.current.fields).toHaveLength(0)
  })
})

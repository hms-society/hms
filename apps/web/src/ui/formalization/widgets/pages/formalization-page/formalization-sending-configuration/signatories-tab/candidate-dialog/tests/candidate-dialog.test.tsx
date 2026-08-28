import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CandidateDialog } from '..'
import { useFormalizationSignatureCandidatesQuery } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

vi.mock(
  '@/ui/formalization/hooks/use-formalization-signature-configuration-action',
  () => ({
    useFormalizationSignatureCandidatesQuery: vi.fn(() => ({
      candidates: [],
      candidatePages: [],
      candidatesError: null,
      fetchNextCandidatesPage: vi.fn(),
      hasNextCandidatePage: false,
      isErrorCandidates: false,
      isFetchingCandidates: false,
      isFetchingNextCandidatesPage: false,
      isLoadingCandidates: false,
      refetchCandidates: vi.fn(),
    })),
  }),
)

const useCandidatesMock = vi.mocked(useFormalizationSignatureCandidatesQuery)

describe('CandidateDialog', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the search interface when open', () => {
    render(
      <CandidateDialog
        formalizationId='formalization-1'
        open
        isPending={false}
        onOpenChange={vi.fn()}
        onSelect={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByLabelText('Buscar colaborador')).toBeTruthy()
  })

  it('renders a localized profile and the shared collaborator avatar', () => {
    useCandidatesMock.mockReturnValue({
      candidates: [
        {
          collaboratorId: 'collaborator-1',
          name: 'Marina Costa',
          email: 'marina@example.com',
          profile: 'lawyer',
          availableChannels: ['email'],
        },
      ],
      candidatePages: [],
      candidatesError: null,
      fetchNextCandidatesPage: vi.fn(),
      hasNextCandidatePage: false,
      isErrorCandidates: false,
      isFetchingCandidates: false,
      isFetchingNextCandidatesPage: false,
      isLoadingCandidates: false,
      refetchCandidates: vi.fn(),
    })

    render(
      <CandidateDialog
        formalizationId='formalization-1'
        open
        isPending={false}
        onOpenChange={vi.fn()}
        onSelect={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    expect(screen.getByText('Advogado')).toBeTruthy()
    expect(screen.queryByText('lawyer')).toBeNull()
    expect(screen.getByText('MC')).toBeTruthy()
  })

  it('renders card-shaped skeletons while candidates are loading', () => {
    useCandidatesMock.mockReturnValue({
      candidates: [],
      candidatePages: [],
      candidatesError: null,
      fetchNextCandidatesPage: vi.fn(),
      hasNextCandidatePage: false,
      isErrorCandidates: false,
      isFetchingCandidates: true,
      isFetchingNextCandidatesPage: false,
      isLoadingCandidates: true,
      refetchCandidates: vi.fn(),
    })

    render(
      <CandidateDialog
        formalizationId='formalization-1'
        open
        isPending={false}
        onOpenChange={vi.fn()}
        onSelect={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    expect(screen.getByText('Buscando colaboradores...')).toBeTruthy()
    expect(
      screen.getByRole('dialog').querySelectorAll('[data-slot="skeleton"]'),
    ).toHaveLength(12)
  })
})

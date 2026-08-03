import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}))

import type { CollaboratorDetailsPageController } from '../use-collaborator-details-page'
import { useCollaboratorDetailsPage } from '../use-collaborator-details-page'
import { CollaboratorDetailsPage } from '../index'

vi.mock('../use-collaborator-details-page', () => ({
  useCollaboratorDetailsPage: vi.fn(),
}))

const useCollaboratorDetailsPageMock = vi.mocked(useCollaboratorDetailsPage)

const collaborator = {
  collaboratorId: 'collaborator-id',
  professionalName: 'Maria Oliveira',
  email: 'maria@example.com',
  profile: 'lawyer' as const,
  jobTitle: 'Coordenadora jurídica',
  status: 'active' as const,
  lastAccessAt: new Date('2026-07-29T15:30:00.000Z'),
  legalExpertises: [
    {
      legalArea: { id: 'area-id', name: 'Trabalhista', active: true },
      legalTopics: [
        { id: 'topic-id', name: 'Contratos', active: true },
        { id: 'topic-2-id', name: 'Relações de trabalho', active: true },
      ],
    },
  ],
}

function createController(
  overrides: Partial<CollaboratorDetailsPageController> = {},
): CollaboratorDetailsPageController {
  return {
    collaborator,
    collaboratorError: null,
    deactivateCollaboratorError: null,
    isCollaboratorDisabled: false,
    formatCollaboratorLastAccess: () => '29/07/2026, 12:30',
    getLegalExpertises: () => [
      { areaName: 'Trabalhista', topicNames: ['Contratos', 'Relações de trabalho'] },
    ],
    getProfileLabel: () => 'Advogado',
    getStatusLabel: () => 'Ativo',
    handleConfirmDeactivate: vi.fn(),
    handleConfirmReactivate: vi.fn(),
    handleDeactivateDialogOpenChange: vi.fn(),
    handleEditDialogOpenChange: vi.fn(),
    handleEditSuccess: vi.fn(),
    handleOpenDeactivate: vi.fn(),
    handleOpenEdit: vi.fn(),
    handleOpenReactivate: vi.fn(),
    handleReactivateDialogOpenChange: vi.fn(),
    isDeactivateDialogOpen: false,
    isDeactivatingCollaborator: false,
    isEditDialogOpen: false,
    isLoadingCollaborator: false,
    isReactivateDialogOpen: false,
    isReactivatingCollaborator: false,
    reactivateCollaboratorError: null,
    refetch: vi.fn(),
    ...overrides,
  }
}

describe('Collaborator Details Page', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the overview tab with collaborator information', () => {
    useCollaboratorDetailsPageMock.mockReturnValue(createController())

    render(<CollaboratorDetailsPage collaboratorId='collaborator-id' />)

    expect(screen.getByRole('heading', { name: 'Maria Oliveira' })).toBeTruthy()
    expect(screen.getByText('Dados de contato')).toBeTruthy()
    expect(screen.getByText('maria@example.com')).toBeTruthy()
    expect(screen.getByText('Trabalhista')).toBeTruthy()
    expect(screen.getByText('Contratos')).toBeTruthy()
    expect(screen.getByText('Relações de trabalho')).toBeTruthy()
    expect(screen.getByText('Visão geral')).toBeTruthy()
  })

  it('allows retrying when the collaborator cannot be loaded', () => {
    const refetch = vi.fn()
    useCollaboratorDetailsPageMock.mockReturnValue(
      createController({
        collaborator: null,
        collaboratorError: new Error('failure'),
        refetch,
      }),
    )

    render(<CollaboratorDetailsPage collaboratorId='collaborator-id' />)

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('shows the reactivation action for a disabled collaborator', () => {
    const handleOpenReactivate = vi.fn()
    useCollaboratorDetailsPageMock.mockReturnValue(
      createController({
        collaborator: { ...collaborator, status: 'disabled' },
        handleOpenReactivate,
        isCollaboratorDisabled: true,
      }),
    )

    render(<CollaboratorDetailsPage collaboratorId='collaborator-id' />)

    fireEvent.click(screen.getByRole('button', { name: 'Reativar colaborador' }))

    expect(handleOpenReactivate).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: /^Inativar$/ })).toBeNull()
  })

  it('delegates profile editing and deactivation to the page controller', () => {
    const handleOpenEdit = vi.fn()
    const handleOpenDeactivate = vi.fn()
    useCollaboratorDetailsPageMock.mockReturnValue(
      createController({ handleOpenEdit, handleOpenDeactivate }),
    )

    render(<CollaboratorDetailsPage collaboratorId='collaborator-id' />)

    const editButtons = screen.getAllByRole('button', { name: 'Editar perfil' })
    const deactivateButtons = screen.getAllByRole('button', { name: 'Inativar' })
    fireEvent.click(editButtons[editButtons.length - 1])
    fireEvent.click(deactivateButtons[deactivateButtons.length - 1])

    expect(handleOpenEdit).toHaveBeenCalledOnce()
    expect(handleOpenDeactivate).toHaveBeenCalledOnce()
  })
})

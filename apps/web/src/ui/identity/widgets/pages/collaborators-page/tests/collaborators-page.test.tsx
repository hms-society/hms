import { fireEvent, render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}))

import {
  COLLABORATOR_PROFILE_LABELS,
  COLLABORATOR_STATUS_LABELS,
  formatCollaboratorLastAccess,
} from '../collaborators-page-constants'
import type {
  CollaboratorAction,
  CollaboratorsPageController,
} from '../use-collaborators-page'
import { useCollaboratorsPage } from '../use-collaborators-page'
import { CollaboratorsPage } from '../index'

vi.mock('../use-collaborators-page', () => ({
  useCollaboratorsPage: vi.fn(),
}))

const useCollaboratorsPageMock = vi.mocked(useCollaboratorsPage)

const collaborator = {
  collaboratorId: 'collaborator-id',
  professionalName: 'Ana Ribeiro',
  email: 'ana@example.com',
  profile: 'lawyer' as const,
  status: 'active' as const,
  lastAccessAt: new Date('2026-07-29T15:30:00.000Z'),
  legalExpertises: [],
}

const invitedCollaborator = {
  ...collaborator,
  collaboratorId: 'invited-collaborator-id',
  professionalName: 'João Mendes',
  email: 'joao@example.com',
  status: 'invited' as const,
  lastAccessAt: undefined,
}

function createController(
  overrides: Partial<CollaboratorsPageController> = {},
): CollaboratorsPageController {
  return {
    actionError: null,
    collaboratorsPage: {
      items: [collaborator],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    },
    collaboratorsPageError: null,
    formatCollaboratorLastAccess,
    getCollaboratorActionButtonLabel: vi.fn(),
    getCollaboratorActionDescription: vi.fn(),
    getCollaboratorActionIcon: vi.fn(),
    getCollaboratorActionTitle: vi.fn(),
    isActionPending: false,
    isLoadingCollaborators: false,
    jobTitles: ['Advogada'],
    page: 1,
    profileLabels: COLLABORATOR_PROFILE_LABELS,
    query: { page: 1, pageSize: 20 },
    refetch: vi.fn(),
    selectedAction: undefined,
    selectedEditCollaborator: undefined,
    statusLabels: COLLABORATOR_STATUS_LABELS,
    totalPages: 1,
    handleActionDialogOpenChange: vi.fn(),
    handleClearFilters: vi.fn(),
    handleConfirmAction: vi.fn().mockResolvedValue(undefined),
    handleEditDialogOpenChange: vi.fn(),
    handleEditSuccess: vi.fn(),
    handleOpenEdit: vi.fn(),
    handleOpenAction: vi.fn(),
    handleUpdateSearch: vi.fn(),
    isDestructiveCollaboratorAction: vi.fn(),
    ...overrides,
  }
}

describe('CollaboratorsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the table and the create action', () => {
    useCollaboratorsPageMock.mockReturnValue(createController())

    render(<CollaboratorsPage onCreateCollaborator={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Colaboradores' })).toBeTruthy()
    expect(screen.getByText('Ana Ribeiro')).toBeTruthy()
    expect(screen.getByText(/29\/07\/2026/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /criar colaborador/i })).toBeTruthy()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Ações de Ana Ribeiro' }), {
      button: 0,
    })

    expect(
      screen
        .getByRole('menuitem', { name: 'Ver detalhes' })
        .getAttribute('data-disabled'),
    ).toBeNull()
    expect(
      screen.getByRole('menuitem', { name: 'Editar' }).getAttribute('data-disabled'),
    ).toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Inativar' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Reenviar convite' })).toBeNull()
  })

  it('refetches the current URL query when loading fails', async () => {
    const refetch = vi.fn()
    useCollaboratorsPageMock.mockReturnValue(
      createController({
        collaboratorsPage: null,
        collaboratorsPageError: new Error('temporary failure'),
        refetch,
      }),
    )

    render(<CollaboratorsPage />)

    screen.getByRole('button', { name: 'Tentar novamente' }).click()

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('does not expose removal for a disabled collaborator', () => {
    const cancelledInvitation = {
      ...collaborator,
      status: 'disabled' as const,
      lastAccessAt: new Date('2026-07-29T15:30:00.000Z'),
    }
    useCollaboratorsPageMock.mockReturnValue(
      createController({
        collaboratorsPage: {
          items: [cancelledInvitation],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      }),
    )

    render(<CollaboratorsPage onCreateCollaborator={vi.fn()} />)

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Ações de Ana Ribeiro' }), {
      button: 0,
    })

    expect(screen.getByRole('menuitem', { name: 'Ver detalhes' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Remover colaborador' })).toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Reativar' })).toBeTruthy()
  })

  it('exposes invitation actions only for a pending collaborator', () => {
    useCollaboratorsPageMock.mockReturnValue(
      createController({
        collaboratorsPage: {
          items: [invitedCollaborator],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      }),
    )

    render(<CollaboratorsPage />)

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Ações de João Mendes' }), {
      button: 0,
    })

    expect(screen.getByRole('menuitem', { name: 'Reenviar convite' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Cancelar convite' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Inativar' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Reativar' })).toBeNull()
  })

  it('delegates filter, reset, and pagination interactions to the page controller', () => {
    const handleUpdateSearch = vi.fn()
    const handleClearFilters = vi.fn()
    useCollaboratorsPageMock.mockReturnValue(
      createController({
        handleUpdateSearch,
        handleClearFilters,
        page: 1,
        totalPages: 2,
        collaboratorsPage: {
          items: [collaborator],
          page: 1,
          pageSize: 20,
          total: 21,
          totalPages: 2,
        },
      }),
    )

    render(<CollaboratorsPage />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar por nome ou e-mail' }), {
      target: { value: 'Maria' },
    })
    screen.getByRole('button', { name: /limpar/i }).click()
    screen.getByRole('button', { name: 'Próxima página' }).click()

    expect(handleUpdateSearch).toHaveBeenCalledWith({ search: 'Maria' })
    expect(handleClearFilters).toHaveBeenCalledOnce()
    expect(handleUpdateSearch).toHaveBeenCalledWith({ page: 2 })
  })

  it('renders the filtered empty state and delegates filter clearing', () => {
    const handleClearFilters = vi.fn()
    useCollaboratorsPageMock.mockReturnValue(
      createController({
        collaboratorsPage: {
          items: [],
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
        handleClearFilters,
        query: { search: 'inexistente', page: 1, pageSize: 20 },
      }),
    )

    render(<CollaboratorsPage />)

    expect(
      screen.getByRole('heading', { name: 'Nenhum colaborador encontrado' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Ajuste ou limpe os filtros para tentar novamente.'),
    ).toBeTruthy()

    screen.getByRole('button', { name: 'Limpar filtros' }).click()

    expect(handleClearFilters).toHaveBeenCalledOnce()
  })

  it('submits the selected action through the page controller', () => {
    const handleConfirmAction = vi.fn().mockResolvedValue(undefined)
    const selectedAction: CollaboratorAction = { kind: 'deactivate', collaborator }
    useCollaboratorsPageMock.mockReturnValue(
      createController({
        handleConfirmAction,
        selectedAction,
        getCollaboratorActionButtonLabel: vi.fn(() => 'Inativar colaborador' as const),
        getCollaboratorActionDescription: vi.fn(
          () => 'Essa ação suspenderá o acesso de Ana Ribeiro à HMS.',
        ),
        getCollaboratorActionIcon: vi.fn(() => 'user-x' as const),
        getCollaboratorActionTitle: vi.fn(() => 'Inativar colaborador?' as const),
        isDestructiveCollaboratorAction: vi.fn(() => true),
      }),
    )

    render(<CollaboratorsPage />)

    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Inativar colaborador?' })).toBeTruthy()

    screen.getByRole('button', { name: 'Inativar colaborador' }).click()

    expect(handleConfirmAction).toHaveBeenCalledOnce()
  })
})

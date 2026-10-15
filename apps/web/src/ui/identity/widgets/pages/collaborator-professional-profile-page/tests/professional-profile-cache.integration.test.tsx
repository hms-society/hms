import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { CollaboratorProfessionalProfilePage } from '..'
import { useCollaboratorProfessionalProfilePage } from '../use-collaborator-professional-profile-page'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useRestContextMock = vi.mocked(useRestContext)
const TARGET_ID = '00000000-0000-4000-8000-000000000040'
const ADMIN_ID = '00000000-0000-4000-8000-000000000070'
const LAWYER_ID = '00000000-0000-4000-8000-000000000080'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CollaboratorProfessionalProfilePage cache isolation', () => {
  it('renders only the legal projection with Admin detail and profile cache already populated', async () => {
    const adminDetail = {
      collaboratorId: TARGET_ID,
      professionalName: 'Maria Oliveira',
      email: 'maria@example.test',
      profile: 'lawyer',
      status: 'active',
      taxId: '12345678900',
      lastAccessAt: '2026-10-01T12:00:00Z',
      permissions: ['manage-collaborators'],
      audit: 'Admin-only audit entry',
      waba: 'Admin-only WABA setting',
    }
    const professionalProfile = {
      collaboratorId: TARGET_ID,
      professionalName: adminDetail.professionalName,
      email: adminDetail.email,
      profile: 'lawyer' as const,
      legalExpertises: [
        {
          legalArea: { id: 'area-1', name: 'Trabalhista' },
          legalTopics: [{ id: 'topic-1', name: 'Contratos' }],
        },
      ],
    }
    const getCollaborator = vi.fn()
    const getCollaboratorProfessionalProfile = vi
      .fn()
      .mockResolvedValue(new RestResponse({ body: professionalProfile }))
    useRestContextMock.mockReturnValue({
      identityService: {
        getCollaborator,
        getCollaboratorProfessionalProfile,
        getCurrentCollaborator: vi.fn().mockResolvedValue(
          new RestResponse({
            body: { collaboratorId: LAWYER_ID, profile: 'lawyer', status: 'active' },
          }),
        ),
      },
    } as unknown as ReturnType<typeof useRestContext>)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['identity', 'collaborator', TARGET_ID], adminDetail)
    queryClient.setQueryData(['identity', 'professional-profile', TARGET_ID, ADMIN_ID], {
      ...adminDetail,
      legalExpertises: professionalProfile.legalExpertises,
    })
    queryClient.setQueryData(['identity', 'collaborator', 'current'], {
      collaboratorId: LAWYER_ID,
      profile: 'lawyer',
      status: 'active',
    })

    render(
      <QueryClientProvider client={queryClient}>
        <CollaboratorProfessionalProfilePage collaboratorId={TARGET_ID} />
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Maria Oliveira' })).toBeDefined()
    expect(screen.getByText('Trabalhista')).toBeDefined()
    expect(screen.getByText('Contratos')).toBeDefined()
    expect(getCollaboratorProfessionalProfile).toHaveBeenCalledWith(TARGET_ID)
    expect(getCollaboratorProfessionalProfile).toHaveBeenCalledTimes(1)
    expect(getCollaborator).not.toHaveBeenCalled()
    expect(screen.queryByText(adminDetail.taxId)).toBeNull()
    expect(screen.queryByText(adminDetail.audit)).toBeNull()
    expect(screen.queryByText(adminDetail.waba)).toBeNull()
    expect(screen.queryByRole('button', { name: /Editar|Inativar|Reativar/ })).toBeNull()
    expect(
      queryClient.getQueryData([
        'identity',
        'professional-profile',
        TARGET_ID,
        LAWYER_ID,
      ]),
    ).toEqual(professionalProfile)
    queryClient.clear()
  })

  it.each([
    { statusCode: 403, shouldRemoveProfileCache: true },
    { statusCode: 500, shouldRemoveProfileCache: false },
  ])('clears this viewer’s cached projection only after a $statusCode profile failure', async ({
    statusCode,
    shouldRemoveProfileCache,
  }) => {
    const cachedProfile = {
      collaboratorId: TARGET_ID,
      professionalName: 'Maria Oliveira',
      email: 'maria@example.test',
      profile: 'lawyer' as const,
      legalExpertises: [],
    }
    const getCollaboratorProfessionalProfile = vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ statusCode, errorMessage: 'Profile unavailable' }),
      )
    useRestContextMock.mockReturnValue({
      identityService: {
        getCollaboratorProfessionalProfile,
        getCurrentCollaborator: vi.fn().mockResolvedValue(
          new RestResponse({
            body: { collaboratorId: LAWYER_ID, profile: 'lawyer', status: 'active' },
          }),
        ),
      },
    } as unknown as ReturnType<typeof useRestContext>)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['identity', 'collaborator', 'current'], {
      collaboratorId: LAWYER_ID,
      profile: 'lawyer',
      status: 'active',
    })
    queryClient.setQueryData(
      ['identity', 'professional-profile', TARGET_ID, LAWYER_ID],
      cachedProfile,
      { updatedAt: Date.now() - 60_000 },
    )
    queryClient.setQueryData(
      ['identity', 'professional-profile', TARGET_ID, ADMIN_ID],
      cachedProfile,
    )

    render(
      <QueryClientProvider client={queryClient}>
        <CollaboratorProfessionalProfilePage collaboratorId={TARGET_ID} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(getCollaboratorProfessionalProfile).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(
        queryClient.getQueryData([
          'identity',
          'professional-profile',
          TARGET_ID,
          LAWYER_ID,
        ]),
      ).toEqual(shouldRemoveProfileCache ? undefined : cachedProfile),
    )
    expect(
      queryClient.getQueryData(['identity', 'professional-profile', TARGET_ID, ADMIN_ID]),
    ).toEqual(cachedProfile)
    queryClient.clear()
  })

  it('clears the current viewer’s professional profile through its page hook', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const removeQueries = vi
      .spyOn(queryClient, 'removeQueries')
      .mockImplementation(() => undefined)
    queryClient.setQueryData(['identity', 'collaborator', 'current'], {
      collaboratorId: LAWYER_ID,
      profile: 'lawyer',
      status: 'active',
    })
    queryClient.setQueryData(['identity', 'professional-profile', TARGET_ID, LAWYER_ID], {
      collaboratorId: TARGET_ID,
      professionalName: 'Maria Oliveira',
      email: 'maria@example.test',
      profile: 'lawyer',
      legalExpertises: [],
    })
    useRestContextMock.mockReturnValue({
      identityService: {
        getCollaboratorProfessionalProfile: vi.fn().mockResolvedValue(
          new RestResponse({
            body: {
              collaboratorId: TARGET_ID,
              professionalName: 'Maria Oliveira',
              email: 'maria@example.test',
              profile: 'lawyer',
              legalExpertises: [],
            },
          }),
        ),
      },
    } as unknown as ReturnType<typeof useRestContext>)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () => useCollaboratorProfessionalProfilePage(TARGET_ID),
      { wrapper },
    )

    act(() => result.current.clearProfessionalProfile())

    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['identity', 'professional-profile', TARGET_ID, LAWYER_ID],
    })
    queryClient.clear()
  })
})

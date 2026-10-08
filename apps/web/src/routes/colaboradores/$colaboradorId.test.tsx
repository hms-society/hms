import { describe, expect, it, vi } from 'vitest'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

const mocks = vi.hoisted(() => ({
  routeOptions: undefined as unknown,
  params: {} as Record<string, string>,
  context: {} as Record<string, unknown>,
  requireProfessionalProfileReaderMiddleware: vi.fn(),
  CollaboratorDetailsPage: vi.fn(),
  CollaboratorProfessionalProfilePage: vi.fn(),
  AppLayout: vi.fn(),
  RouteAccessError: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: unknown) => {
    mocks.routeOptions = options

    return {
      options,
      useParams: () => mocks.params,
      useRouteContext: () => mocks.context,
    }
  },
}))
vi.mock('@/middlewares/require-professional-profile-reader-middleware', () => ({
  requireProfessionalProfileReaderMiddleware:
    mocks.requireProfessionalProfileReaderMiddleware,
}))
vi.mock('@/ui/identity/widgets/pages/collaborator-details-page', () => ({
  CollaboratorDetailsPage: mocks.CollaboratorDetailsPage,
}))
vi.mock('@/ui/identity/widgets/pages/collaborator-professional-profile-page', () => ({
  CollaboratorProfessionalProfilePage: mocks.CollaboratorProfessionalProfilePage,
}))
vi.mock('@/ui/shared/widgets/layouts/app-layout', () => ({ AppLayout: mocks.AppLayout }))
vi.mock('@/ui/shared/widgets/components/route-access-error', () => ({
  RouteAccessError: mocks.RouteAccessError,
}))

import './$colaboradorId'

type RouteOptions = {
  beforeLoad?: unknown
  component?: () => React.ReactNode
  errorComponent?: unknown
  ssr?: boolean
}

type LayoutElement = React.ReactElement<{ children: React.ReactElement }>

function getOptions(): RouteOptions {
  return mocks.routeOptions as RouteOptions
}

describe('Collaborator details route', () => {
  it('allows the professional profile reader guard and renders the full Admin page', () => {
    mocks.params = { colaboradorId: 'collaborator-1' }
    mocks.context = { currentCollaborator: { profile: CollaboratorProfile.Admin } }
    const options = getOptions()
    const layout = options.component?.() as LayoutElement
    const page = layout.props.children

    expect(options.beforeLoad).toBe(mocks.requireProfessionalProfileReaderMiddleware)
    expect(options.errorComponent).toBeDefined()
    expect(options.ssr).toBe(false)
    expect(layout.type).toBe(mocks.AppLayout)
    expect(page.type).toBe(mocks.CollaboratorDetailsPage)
    expect(page.props).toEqual({ collaboratorId: 'collaborator-1' })
  })

  it('renders the professional profile page for a legal collaborator', () => {
    mocks.params = { colaboradorId: 'lawyer-2' }
    mocks.context = { currentCollaborator: { profile: CollaboratorProfile.Lawyer } }
    const layout = getOptions().component?.() as LayoutElement
    const page = layout.props.children

    expect(page.type).toBe(mocks.CollaboratorProfessionalProfilePage)
    expect(page.props).toEqual({ collaboratorId: 'lawyer-2' })
  })
})

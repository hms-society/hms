import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import type { DocumentSpecificationListItem } from '@hms/core/document-production/domain/structures'
import { DocumentSpecificationsPage } from '..'
import { useDocumentCatalogQuery } from '../use-document-catalog-query'
import { useDocumentSpecificationsQuery } from '../use-document-specifications-query'
import { useDocumentTopicsQuery } from '../use-document-topics-query'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
    <a href='/modelos-de-documentos/spec-1' {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({
    children,
    route,
    params,
    ...props
  }: {
    children: ReactNode
    route: string
    params?: Record<string, string>
    [key: string]: unknown
  }) => (
    <a
      href={
        route === 'newDocumentSpecification'
          ? '/modelos-de-documentos/novo'
          : `/modelos-de-documentos/${params?.documentSpecificationId ?? ''}`
      }
      {...props}
    >
      {children}
    </a>
  ),
}))

vi.mock('../use-document-catalog-query', () => ({
  useDocumentCatalogQuery: vi.fn(),
}))
vi.mock('../use-document-specifications-query', () => ({
  useDocumentSpecificationsQuery: vi.fn(),
}))
vi.mock('../use-document-topics-query', () => ({
  useDocumentTopicsQuery: vi.fn(),
}))

const useDocumentCatalogQueryMock = vi.mocked(useDocumentCatalogQuery)
const useDocumentSpecificationsQueryMock = vi.mocked(useDocumentSpecificationsQuery)
const useDocumentTopicsQueryMock = vi.mocked(useDocumentTopicsQuery)

const item = {
  documentSpecificationId: 'spec-1',
  name: 'Procuração',
  description: 'Documento de representação',
  application: { scope: 'global' as const, moment: 'consultation' as const },
  accessClassification: 'Interno',
  status: 'available' as const,
}

const legalContextItem = {
  ...item,
  application: {
    scope: 'legal_context' as const,
    moment: 'consultation' as const,
    legalExpertises: [
      {
        legalAreaId: 'area-1',
        legalAreaName: 'Cível',
        legalTopics: [{ legalTopicId: 'topic-1', legalTopicName: 'Contratos' }],
      },
    ],
  },
}

function createSpecificationsResult(
  overrides: Record<string, unknown> = {},
  items: readonly DocumentSpecificationListItem[] = [item],
) {
  return {
    data: { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  }
}

function renderPage(searchParams = '') {
  return render(<DocumentSpecificationsPage />, {
    wrapper: withNuqsTestingAdapter({ searchParams }),
  })
}

describe('DocumentSpecificationsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentSpecificationsQueryMock.mockReturnValue(
      createSpecificationsResult() as never,
    )
    useDocumentCatalogQueryMock.mockReturnValue({
      areas: { data: [], isLoading: false, isError: false },
    } as never)
    useDocumentTopicsQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never)
  })

  it('renders the table contract and row actions through the real page composition', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Modelos de documentos' })).toBeDefined()
    expect(screen.getAllByText('Procuração').length).toBeGreaterThan(0)
    expect(screen.getByText('Global')).toBeDefined()
    expect(screen.getAllByText('Consulta').length).toBeGreaterThan(0)
    expect(screen.getByRole('columnheader', { name: 'Modelo' })).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'Ação' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Editar Procuração' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Novo modelo' }).getAttribute('href')).toBe(
      '/modelos-de-documentos/novo',
    )
    expect(screen.queryByRole('button', { name: 'Duplicar Procuração' })).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'Atualizado' })).toBeNull()
  })

  it('offers retry when the list request fails', () => {
    const refetch = vi.fn()
    useDocumentSpecificationsQueryMock.mockReturnValue(
      createSpecificationsResult({ data: undefined, isError: true, refetch }) as never,
    )

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('announces catalog unavailability without hiding the table', () => {
    useDocumentCatalogQueryMock.mockReturnValue({
      areas: { data: undefined, isLoading: false, isError: true },
    } as never)

    renderPage()

    expect(screen.getByRole('alert').textContent).toContain(
      'As opções de aplicação estão indisponíveis',
    )
    expect(screen.getByText('Procuração')).toBeDefined()
  })

  it('renders complete legal application names accessibly', () => {
    useDocumentSpecificationsQueryMock.mockReturnValue(
      createSpecificationsResult({}, [legalContextItem]) as never,
    )

    renderPage()

    expect(screen.getByText('Cível: Contratos')).toBeDefined()
    expect(screen.getByText('Consulta')).toBeDefined()
  })
})

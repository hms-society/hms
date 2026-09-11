import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormalizationSendingConfigurationPage } from '..'
import { useFormalizationSendingConfigurationPage } from '../use-formalization-sending-configuration-page'

vi.mock('../use-formalization-sending-configuration-page', () => ({
  useFormalizationSendingConfigurationPage: vi.fn(),
}))
vi.mock('../../formalization-sending-configuration', () => ({
  FormalizationSendingConfigurationPanel: (props: Record<string, unknown>) => (
    <output data-testid='sending-panel'>{JSON.stringify(props)}</output>
  ),
}))
vi.mock('../../formalization-page/formalization-state-panels', () => ({
  FormalizationLoadingPanel: () => <p>loading formalization</p>,
  FormalizationStatePanel: ({ title }: { title: string }) => <p>{title}</p>,
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: { children: React.ReactNode }) => (
    <a href='/formalization'>{children}</a>
  ),
}))

const usePage = vi.mocked(useFormalizationSendingConfigurationPage)

function createPage(overrides: Record<string, unknown> = {}) {
  return {
    query: { data: undefined, isError: false, isLoading: false, refetch: vi.fn() },
    documentProduction: { isPackageConfirmed: false },
    signatureConfiguration: { configuration: undefined },
    signatureSending: {
      status: undefined,
      isLoadingReview: false,
      isLoadingStatus: false,
      refetchReview: vi.fn(),
      refetchStatus: vi.fn(),
    },
    formalization: undefined,
    ...overrides,
  } as never
}

describe('FormalizationSendingConfigurationPage', () => {
  afterEach(cleanup)
  beforeEach(() => vi.clearAllMocks())

  it('keeps the page loading while the full query has no tracking status', () => {
    usePage.mockReturnValue(createPage({ query: { isLoading: true, isError: false } }))

    render(<FormalizationSendingConfigurationPage formalizationId='formalization-1' />)

    expect(screen.getByText('loading formalization')).not.toBeNull()
    expect(screen.queryByTestId('sending-panel')).toBeNull()
  })

  it('preserves tracking-only mode when the full query fails but status is available', () => {
    usePage.mockReturnValue(
      createPage({
        query: { isLoading: false, isError: true, data: undefined },
        signatureSending: {
          status: { requestId: 'request-1', viewerMode: 'tracking_only' },
        },
      }),
    )

    render(<FormalizationSendingConfigurationPage formalizationId='formalization-1' />)

    const panel = screen.getByTestId('sending-panel').textContent ?? ''
    expect(panel).toContain('"trackingOnly":true')
    expect(panel).toContain('"isPackageConfirmed":true')
  })

  it('derives the formalization version and editability from the full query', () => {
    usePage.mockReturnValue(
      createPage({
        query: {
          isLoading: false,
          isError: false,
          data: { formalization: { version: 8, status: 'in_progress' } },
        },
        formalization: { version: 8, status: 'in_progress' },
        documentProduction: { isPackageConfirmed: true },
      }),
    )

    render(<FormalizationSendingConfigurationPage formalizationId='formalization-1' />)

    const panel = screen.getByTestId('sending-panel').textContent ?? ''
    expect(panel).toContain('"expectedVersion":8')
    expect(panel).toContain('"isReadOnly":false')
    expect(panel).toContain('"trackingOnly":false')
  })
})

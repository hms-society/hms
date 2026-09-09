import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormalizationDocumentReviewPage } from '../index'
import { useFormalizationDocumentReviewPage } from '../use-formalization-document-review-page'

vi.mock('../use-formalization-document-review-page', () => ({
  useFormalizationDocumentReviewPage: vi.fn(),
}))

const useFormalizationDocumentReviewPageMock = vi.mocked(
  useFormalizationDocumentReviewPage,
)

type Review = ReturnType<typeof useFormalizationDocumentReviewPage>

function createReview(overrides: Partial<Review> = {}): Review {
  return {
    isLoading: false,
    isError: true,
    viewModel: undefined,
    version: undefined,
    draft: undefined,
    handleBack: vi.fn(),
    handleRetry: vi.fn(),
    ...overrides,
  } as unknown as Review
}

describe('FormalizationDocumentReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFormalizationDocumentReviewPageMock.mockReturnValue(createReview())
  })

  afterEach(cleanup)

  it('renders the loading state from its colocated hook', () => {
    useFormalizationDocumentReviewPageMock.mockReturnValue(
      createReview({ isLoading: true, isError: false }),
    )

    render(
      <FormalizationDocumentReviewPage
        formalizationId='formalization-1'
        documentVersionId='version-1'
      />,
    )

    expect(screen.getByText('Carregando versão…')).not.toBeNull()
  })

  it('renders the recovery state when the version cannot be loaded', () => {
    const handleRetry = vi.fn().mockResolvedValue(undefined)
    useFormalizationDocumentReviewPageMock.mockReturnValue(createReview({ handleRetry }))

    render(
      <FormalizationDocumentReviewPage
        formalizationId='formalization-1'
        documentVersionId='version-1'
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Não foi possível carregar esta versão.' }),
    ).not.toBeNull()
    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' })
    expect(retryButton).not.toBeNull()

    fireEvent.click(retryButton)

    expect(handleRetry).toHaveBeenCalledOnce()
  })
})

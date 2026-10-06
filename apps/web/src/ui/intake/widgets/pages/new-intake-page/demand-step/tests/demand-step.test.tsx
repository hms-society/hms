import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'
import type { IntakeFormData } from '@hms/validation/intake'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { StepDemand } from '..'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('StepDemand', () => {
  const legalCatalogService = {
    listLegalAreas: vi.fn(),
    listLegalTopics: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    HTMLElement.prototype.scrollIntoView = vi.fn()
    useRestContextMock.mockReturnValue({ legalCatalogService } as never)
    legalCatalogService.listLegalAreas.mockResolvedValue(
      new RestResponse({ body: [{ id: 'area-id', name: 'Cível' }] }),
    )
    legalCatalogService.listLegalTopics.mockResolvedValue(
      new RestResponse({ body: [{ id: 'topic-id', name: 'Contratos' }] }),
    )
  })

  it('loads legal areas and fetches topics after an area is selected', async () => {
    renderStepDemand()

    await waitFor(() => expect(legalCatalogService.listLegalAreas).toHaveBeenCalledOnce())
    expect(legalCatalogService.listLegalTopics).not.toHaveBeenCalled()

    const legalAreaSelect = screen.getByRole('combobox', { name: /Área jurídica/ })
    await waitFor(() =>
      expect((legalAreaSelect as HTMLButtonElement).disabled).toBe(false),
    )
    fireEvent.click(legalAreaSelect)
    fireEvent.click(await screen.findByRole('option', { name: 'Cível' }))

    await waitFor(() =>
      expect(legalCatalogService.listLegalTopics).toHaveBeenCalledWith('area-id'),
    )
    fireEvent.click(screen.getByRole('combobox', { name: /Tema jurídico/ }))
    expect(await screen.findByRole('option', { name: 'Contratos' })).toBeDefined()
    expect(legalCatalogService.listLegalTopics).toHaveBeenCalledWith('area-id')
  })

  it('shows a recoverable message when the legal catalog cannot be loaded', async () => {
    legalCatalogService.listLegalAreas.mockResolvedValue(
      new RestResponse({ statusCode: 500, errorMessage: 'temporary failure' }),
    )

    renderStepDemand()

    expect(
      await screen.findByText(
        'Não foi possível carregar o catálogo jurídico. Tente novamente.',
      ),
    ).toBeDefined()
    expect(legalCatalogService.listLegalTopics).not.toHaveBeenCalled()
  })
})

function renderStepDemand() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <StepDemandTestHarness />
    </QueryClientProvider>,
  )
}

function StepDemandTestHarness() {
  const form = useForm<IntakeFormData>({
    defaultValues: {
      origin: 'direct',
      contactChannel: 'whatsapp',
      legalAreaId: '',
      legalTopicId: '',
      urgency: 'normal',
      notes: '',
      clientId: '',
      decision: 'schedule',
    },
  })

  return (
    <FormProvider {...form}>
      <StepDemand />
    </FormProvider>
  )
}

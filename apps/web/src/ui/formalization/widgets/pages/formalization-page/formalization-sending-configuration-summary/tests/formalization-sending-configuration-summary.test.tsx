import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildFormalizationSendingConfigurationPath } from '@/constants/routes'
import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { FormalizationSendingConfigurationSummary } from '../index'
import { useFormalizationSendingConfigurationSummary } from '../use-formalization-sending-configuration-summary'

vi.mock('../use-formalization-sending-configuration-summary', () => ({
  useFormalizationSendingConfigurationSummary: vi.fn(),
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, params, ...props }: AnchorProps) => (
    <a
      href={
        route === 'formalizationSendingConfiguration'
          ? buildFormalizationSendingConfigurationPath(params?.formalizationId ?? '')
          : route
      }
      {...props}
    >
      {children}
    </a>
  ),
}))

const useFormalizationSendingConfigurationSummaryMock = vi.mocked(
  useFormalizationSendingConfigurationSummary,
)
type Controller = ReturnType<typeof useFormalizationSendingConfigurationSummary>

function createHookController(overrides: Partial<Controller> = {}): Controller {
  return {
    isForbidden: false,
    isLoading: false,
    metrics: [],
    statusLabel: 'Pronto para envio',
    ...overrides,
  }
}

function createConfigurationController(): FormalizationSignatureConfigurationController {
  return {
    configurationError: null,
    isConfigurationError: false,
    isFetchingConfiguration: false,
    isInitializationRequired: false,
    isLoadingConfiguration: false,
    isPreparingConfiguration: false,
    isResettingSignatureConfiguration: false,
    initializationError: null,
  } as unknown as FormalizationSignatureConfigurationController
}

const configuration = {
  formalizationId: 'formalization-1',
  version: 2,
  editable: true,
  status: 'ready_for_sending',
  previewPreparation: { total: 0, pending: 0, processing: 0, ready: 0, failed: 0 },
  signatories: [{ id: 'signatory-1' }, { id: 'signatory-2' }],
  documents: [{ id: 'document-1' }],
  readiness: { ready: true, assignmentCount: 3, issues: [] },
} as unknown as FormalizationSignatureConfiguration

describe('FormalizationSendingConfigurationSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFormalizationSendingConfigurationSummaryMock.mockReturnValue(
      createHookController({
        metrics: [
          { label: 'Signatários', value: '2' },
          { label: 'Documentos', value: '1' },
          { label: 'Atribuições', value: '3' },
        ],
      }),
    )
  })

  afterEach(cleanup)

  it('renders the embedded summary and links to the dedicated page', () => {
    render(
      <FormalizationSendingConfigurationSummary
        formalizationId='formalization-1'
        isPackageConfirmed
        configuration={configuration}
        controller={createConfigurationController()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Configuração do envio' })).not.toBeNull()
    expect(screen.getByText('Pronto para envio')).not.toBeNull()
    expect(screen.getByText('3', { selector: 'p' })).not.toBeNull()
    expect(
      screen.getByRole('link', { name: 'Configuração do envio' }).getAttribute('href'),
    ).toBe('/formalizacoes/formalization-1/configuracao-envio')
  })

  it('keeps access locked until the package is confirmed', () => {
    useFormalizationSendingConfigurationSummaryMock.mockReturnValue(
      createHookController({ statusLabel: 'Aguardando confirmação do pacote' }),
    )

    render(
      <FormalizationSendingConfigurationSummary
        formalizationId='formalization-1'
        isPackageConfirmed={false}
        configuration={undefined}
        controller={createConfigurationController()}
      />,
    )

    expect(
      screen.getByText('Confirme o pacote de documentos para configurar o envio'),
    ).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Configuração do envio' })).not.toBeNull()
  })
})

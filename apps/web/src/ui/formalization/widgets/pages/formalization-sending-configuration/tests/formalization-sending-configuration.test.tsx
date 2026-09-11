import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
import type { FormalizationSignatureSendingController } from '@/ui/formalization/hooks/use-formalization-signature-sending-action'

import { FormalizationSendingConfigurationPanel } from '../index'
import { useFormalizationSendingConfiguration } from '../use-formalization-sending-configuration'
import type { SignatureFieldsTabProps } from '../signature-fields-tab'

vi.mock('../signature-fields-tab', () => ({
  SignatureFieldsTab: (_props: SignatureFieldsTabProps) => null,
}))

vi.mock('../signatories-tab', () => ({
  SignatoriesTab: () => null,
}))

vi.mock('../use-formalization-sending-configuration', () => ({
  useFormalizationSendingConfiguration: vi.fn(),
}))

const usePanelState = vi.mocked(useFormalizationSendingConfiguration)

const configuration = {
  formalizationId: 'formalization-1',
  version: 2,
  editable: true,
  status: 'configuring',
  previewPreparation: { total: 1, pending: 0, processing: 0, ready: 1, failed: 0 },
  signatories: [],
  documents: [],
  readiness: { ready: false, assignmentCount: 0, issues: [] },
} as unknown as FormalizationSignatureConfiguration

function createPanelState(
  overrides: Partial<ReturnType<typeof useFormalizationSendingConfiguration>> = {},
) {
  return {
    activeTab: 'signatures' as const,
    handleConfirmUnsavedChanges: vi.fn(),
    handleFieldsDirtyChange: vi.fn(),
    handleSend: vi.fn().mockResolvedValue(undefined),
    handleTabChange: vi.fn(),
    handleUnsavedChangesDialogOpenChange: vi.fn(),
    isResetDialogOpen: false,
    isSendDialogOpen: false,
    isUnsavedChangesDialogOpen: false,
    setIsResetDialogOpen: vi.fn(),
    setIsSendDialogOpen: vi.fn(),
    ...overrides,
  }
}

function createConfigurationController(
  overrides: Partial<FormalizationSignatureConfigurationController> = {},
) {
  return {
    configurationError: null,
    isConfigurationError: false,
    isFetchingConfiguration: false,
    isInitializationRequired: false,
    isLoadingConfiguration: false,
    isPreparingConfiguration: false,
    isResettingSignatureConfiguration: false,
    initializationError: null,
    initializeConfiguration: vi.fn().mockResolvedValue(undefined),
    refetchConfiguration: vi.fn().mockResolvedValue(undefined),
    resetSignatureConfiguration: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as FormalizationSignatureConfigurationController
}

function renderPanel(
  options: {
    configuration?: FormalizationSignatureConfiguration
    panelState?: Partial<ReturnType<typeof useFormalizationSendingConfiguration>>
    sending?: FormalizationSignatureSendingController
  } = {},
) {
  usePanelState.mockReturnValue(createPanelState(options.panelState))

  return render(
    <FormalizationSendingConfigurationPanel
      formalizationId='formalization-1'
      expectedVersion={2}
      isPackageConfirmed
      configuration={options.configuration ?? configuration}
      controller={createConfigurationController()}
      sending={options.sending}
    />,
  )
}

function createSendingController(
  overrides: Partial<FormalizationSignatureSendingController> = {},
) {
  return {
    review: undefined,
    status: undefined,
    reviewError: null,
    statusError: null,
    isLoadingReview: false,
    isFetchingReview: false,
    isLoadingStatus: false,
    isConfirming: false,
    isCancelling: false,
    isCancellationPending: false,
    isResending: false,
    resendError: null,
    confirmError: null,
    cancelError: null,
    confirmSending: vi.fn().mockResolvedValue(undefined),
    cancelSending: vi.fn().mockResolvedValue(undefined),
    resendInvitation: vi.fn().mockResolvedValue(undefined),
    refetchReview: vi.fn().mockResolvedValue(undefined),
    refetchStatus: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as FormalizationSignatureSendingController
}

describe('FormalizationSendingConfigurationPanel', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes exactly the contracted two tabs', () => {
    renderPanel()

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Assinaturas',
      'Posicionar campos',
    ])
    expect(screen.queryByRole('tab', { name: 'Resumo' })).toBeNull()
  })

  it('disables field positioning until every signatory is assigned and has a channel', () => {
    renderPanel({
      configuration: {
        ...configuration,
        signatories: [
          {
            signatoryId: 'signatory-1',
            documentIds: [],
            selectedChannels: [],
          },
        ],
      } as unknown as FormalizationSignatureConfiguration,
    })

    expect(
      (screen.getByRole('tab', { name: 'Posicionar campos' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('keeps the fields tab available when signatories are ready', () => {
    renderPanel({
      configuration: {
        ...configuration,
        signatories: [
          {
            signatoryId: 'signatory-1',
            documentIds: ['document-1'],
            selectedChannels: ['email'],
          },
        ],
      } as unknown as FormalizationSignatureConfiguration,
    })

    expect(
      (screen.getByRole('tab', { name: 'Posicionar campos' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })

  it('renders the unsaved-fields confirmation and delegates confirmation', () => {
    const handleConfirmUnsavedChanges = vi.fn()
    renderPanel({
      panelState: {
        activeTab: 'fields',
        isUnsavedChangesDialogOpen: true,
        handleConfirmUnsavedChanges,
      },
    })

    expect(screen.getByRole('alertdialog').textContent).toContain(
      'Existem alterações de campos não salvas',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sair sem salvar' }))
    expect(handleConfirmUnsavedChanges).toHaveBeenCalledOnce()
  })

  it('shows the locked state before package confirmation', () => {
    usePanelState.mockReturnValue(createPanelState())
    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed={false}
        configuration={undefined}
        controller={createConfigurationController()}
      />,
    )

    expect(
      screen.getByText('Confirme o pacote de documentos para configurar o envio'),
    ).not.toBeNull()
  })

  it('allows initialization before adding signatories', () => {
    const initializeConfiguration = vi.fn().mockResolvedValue(undefined)
    usePanelState.mockReturnValue(createPanelState())
    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={
          {
            ...configuration,
            editable: false,
            status: 'initialization_required',
          } as unknown as FormalizationSignatureConfiguration
        }
        controller={createConfigurationController({ initializeConfiguration })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Inicializar configuração' }))

    expect(initializeConfiguration).toHaveBeenCalledWith(2)
  })

  it('confirms sending when the configuration is ready', async () => {
    const setIsSendDialogOpen = vi.fn()
    renderPanel({
      configuration: {
        ...configuration,
        status: 'ready_for_sending',
        signatories: [
          {
            signatoryId: 'signatory-1',
            documentIds: ['document-1'],
            selectedChannels: ['email'],
          },
        ],
        readiness: { ready: true, assignmentCount: 1, issues: [] },
      } as unknown as FormalizationSignatureConfiguration,
      sending: createSendingController(),
      panelState: { setIsSendDialogOpen },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar assinaturas' }))
    expect(setIsSendDialogOpen).toHaveBeenCalledWith(true)
  })

  it('returns to the configuration state after sending is cancelled', () => {
    renderPanel({
      sending: createSendingController({
        status: { status: 'cancelled' } as never,
      }),
    })

    expect(screen.getByRole('tab', { name: 'Assinaturas' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar envio' })).toBeNull()
  })
})

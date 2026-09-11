import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  FormalizationSignatureConfiguration,
  FormalizationSignatureSendingReviewResponse,
} from '@hms/core/formalization/domain/structures'
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

const useFormalizationSendingConfigurationMock = vi.mocked(
  useFormalizationSendingConfiguration,
)
type WidgetController = ReturnType<typeof useFormalizationSendingConfiguration>

function createWidgetController(
  overrides: Partial<WidgetController> = {},
): WidgetController {
  return {
    activeTab: 'summary',
    handleConfirmUnsavedChanges: vi.fn(),
    handleFieldsDirtyChange: vi.fn(),
    handleTabChange: vi.fn(),
    handleUnsavedChangesDialogOpenChange: vi.fn(),
    isResetDialogOpen: false,
    isUnsavedChangesDialogOpen: false,
    setIsResetDialogOpen: vi.fn(),
    ...overrides,
  }
}

function createConfigurationController(
  overrides: Partial<FormalizationSignatureConfigurationController> = {},
): FormalizationSignatureConfigurationController {
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

function createSendingController(
  overrides: Partial<FormalizationSignatureSendingController> = {},
): FormalizationSignatureSendingController {
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
    confirmError: null,
    cancelError: null,
    confirmSending: vi.fn().mockResolvedValue(undefined),
    cancelSending: vi.fn().mockResolvedValue(undefined),
    refetchReview: vi.fn().mockResolvedValue(undefined),
    refetchStatus: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as FormalizationSignatureSendingController
}

const statusDefaults = {
  formalizationId: 'formalization-1',
  formalizationStatus: 'in_progress' as const,
  formalizationVersion: 2,
  progressPercentage: 0,
  canConfirmContracting: false,
  viewerMode: 'operator' as const,
  permissions: { canOperate: true, canViewDocumentContent: true },
  documents: [],
}

const configuration = {
  formalizationId: 'formalization-1',
  version: 2,
  editable: true,
  status: 'configuring',
  previewPreparation: { total: 2, pending: 1, processing: 0, ready: 1, failed: 0 },
  signatories: [],
  documents: [],
  readiness: { ready: false, assignmentCount: 0, issues: [] },
} as unknown as FormalizationSignatureConfiguration

describe('FormalizationSendingConfigurationPanel', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useFormalizationSendingConfigurationMock.mockReturnValue(createWidgetController())
  })

  it('places the summary tab last', () => {
    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={1}
        isPackageConfirmed
        configuration={configuration}
        controller={createConfigurationController()}
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Signatários',
      'Campos',
      'Resumo',
    ])
  })

  it('renders the unsaved fields warning and delegates leaving the editor', () => {
    const handleConfirmUnsavedChanges = vi.fn()
    useFormalizationSendingConfigurationMock.mockReturnValue(
      createWidgetController({
        activeTab: 'fields',
        handleConfirmUnsavedChanges,
        isUnsavedChangesDialogOpen: true,
      }),
    )

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={configuration}
        controller={createConfigurationController()}
      />,
    )

    expect(screen.getByText('Sair do editor de campos?')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Sair sem salvar' }))

    expect(handleConfirmUnsavedChanges).toHaveBeenCalledOnce()
  })

  it('disables the fields tab when a signatory has no document assignment', () => {
    const configurationWithUnassignedSignatory = {
      ...configuration,
      signatories: [{ signatoryId: 'signatory-1', documentIds: [] }],
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={configurationWithUnassignedSignatory}
        controller={createConfigurationController()}
      />,
    )

    expect(
      (screen.getByRole('tab', { name: 'Campos' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('keeps the fields tab enabled when every signatory has a document assignment', () => {
    const configurationWithAssignedSignatory = {
      ...configuration,
      signatories: [
        {
          signatoryId: 'signatory-1',
          documentIds: ['document-1'],
          selectedChannels: ['email'],
          availableChannels: ['email'],
        },
      ],
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={configurationWithAssignedSignatory}
        controller={createConfigurationController()}
      />,
    )

    expect(
      (screen.getByRole('tab', { name: 'Campos' }) as HTMLButtonElement).disabled,
    ).toBe(false)
  })

  it('disables the fields tab when a signatory has no selected sending channel', () => {
    const configurationWithMissingChannel = {
      ...configuration,
      signatories: [
        {
          signatoryId: 'signatory-1',
          documentIds: ['document-1'],
          availableChannels: ['email'],
          selectedChannels: [],
        },
      ],
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={configurationWithMissingChannel}
        controller={createConfigurationController()}
      />,
    )

    expect(
      (screen.getByRole('tab', { name: 'Campos' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('disables the summary tab while the configuration is incomplete', () => {
    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={configuration}
        controller={createConfigurationController()}
      />,
    )

    expect(
      (screen.getByRole('tab', { name: 'Resumo' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      screen.getByRole('tab', { name: 'Signatários' }).getAttribute('aria-selected'),
    ).toBe('true')
  })

  it('enables the summary tab when the configuration is fully ready', () => {
    const readyConfiguration = {
      ...configuration,
      readiness: { ready: true, assignmentCount: 1, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
      />,
    )

    expect(
      (screen.getByRole('tab', { name: 'Resumo' }) as HTMLButtonElement).disabled,
    ).toBe(false)
  })

  it('keeps the configuration locked until the package is confirmed', () => {
    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={1}
        isPackageConfirmed={false}
        configuration={undefined}
        controller={createConfigurationController()}
      />,
    )

    expect(
      screen.getByText('Confirme o pacote de documentos para configurar o envio'),
    ).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Configurar envio' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('initializes the configuration with the current formalization version', async () => {
    const initializeConfiguration = vi.fn().mockResolvedValue(undefined)

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={3}
        isPackageConfirmed
        configuration={undefined}
        controller={createConfigurationController({
          initializeConfiguration,
          isInitializationRequired: true,
        })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Inicializar configuração' }))

    await waitFor(() => {
      expect(initializeConfiguration).toHaveBeenCalledWith(3)
    })
  })

  it('renders preparation progress and keeps the summary unavailable while incomplete', () => {
    useFormalizationSendingConfigurationMock.mockReturnValue(
      createWidgetController({ activeTab: 'summary' }),
    )

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={configuration}
        controller={createConfigurationController({ isPreparingConfiguration: true })}
      />,
    )

    expect(screen.getByRole('progressbar')).not.toBeNull()
    expect(
      (screen.getByRole('tab', { name: 'Resumo' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('clears the fields through reset before redirecting to signatories', async () => {
    const handleTabChange = vi.fn()
    const resetSignatureConfiguration = vi.fn().mockResolvedValue(undefined)
    useFormalizationSendingConfigurationMock.mockImplementation(() => {
      const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
      return createWidgetController({
        activeTab: 'fields',
        handleTabChange,
        isResetDialogOpen,
        setIsResetDialogOpen,
      })
    })

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={configuration}
        controller={createConfigurationController({ resetSignatureConfiguration })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Redefinir configuração' }))
    const resetActions = screen.getAllByRole('button', {
      name: 'Redefinir configuração',
    })
    const confirmReset = resetActions.at(-1)
    if (!confirmReset) throw new Error('Expected the reset confirmation action')
    fireEvent.click(confirmReset)

    await waitFor(() => {
      expect(resetSignatureConfiguration).toHaveBeenCalledWith(2)
      expect(handleTabChange).toHaveBeenCalledWith('signatories')
    })
  })

  it('allows opening the review when configuration is ready', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      previewPreparation: {
        total: 2,
        pending: 0,
        processing: 0,
        ready: 2,
        failed: 0,
      },
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
      />,
    )

    expect(screen.getByText('Revisão necessária')).not.toBeNull()
    expect(
      (
        screen.getByRole('button', {
          name: 'Revisar e iniciar envio',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false)
    expect(
      screen.getByText('Abra a revisão para consultar as pendências antes de confirmar.'),
    ).not.toBeNull()
  })

  it('shows the review loading state without claiming that sending is ready', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({ isLoadingReview: true })}
      />,
    )

    expect(screen.getByText('Validando envio')).not.toBeNull()
    expect(
      (
        screen.getByRole('button', {
          name: 'Revisar e iniciar envio',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Revisar e iniciar envio' }))

    expect(screen.getByText('Carregando revisão...')).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Confirmar envio' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('opens a blocking review so its issues are visible before confirmation', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          review: {
            formalizationId: 'formalization-1',
            version: 2,
            status: 'ready_for_sending',
            ready: false,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [{ code: 'missing_assignment' }],
          },
        })}
      />,
    )

    expect(screen.getByText('Revisão necessária')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Revisar e iniciar envio' }))

    expect(screen.getByText('Atribua todos os documentos e signatários.')).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Confirmar envio' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('blocks confirmation while an existing review is being refreshed', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          isFetchingReview: true,
          review: {
            formalizationId: 'formalization-1',
            version: 2,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
          },
        })}
      />,
    )

    expect(screen.getByText('Validando envio')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Revisar e iniciar envio' }))

    expect(screen.getByText('Atualizando revisão...')).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Confirmar envio' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('exposes a retry action when the sending review fails to load', () => {
    const refetchReview = vi.fn().mockResolvedValue(undefined)
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          refetchReview,
          reviewError: new Error('review unavailable'),
        })}
      />,
    )

    expect(screen.getByText('Revisão indisponível')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Revisar e iniciar envio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(refetchReview).toHaveBeenCalledTimes(2)
    expect(
      (screen.getByRole('button', { name: 'Confirmar envio' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('marks the configuration ready only when review can be confirmed', async () => {
    const confirmSending = vi.fn().mockResolvedValue(undefined)
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={1}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          confirmSending,
          review: {
            formalizationId: 'formalization-1',
            version: 2,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
          },
        })}
      />,
    )

    expect(screen.getByText('Pronto para envio')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Revisar e iniciar envio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar envio' }))

    await waitFor(() => {
      expect(confirmSending).toHaveBeenCalledWith({
        expectedVersion: 2,
        confirmationKey: expect.any(String),
      })
    })
  })

  it('explains a stale confirmation and offers to refresh the authoritative review', () => {
    const refetchReview = vi.fn().mockResolvedValue(undefined)
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          refetchReview,
          confirmError: Object.assign(new Error('stale'), { statusCode: 409 }),
          review: {
            formalizationId: 'formalization-1',
            version: 2,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
          },
        })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Revisar e iniciar envio' }))

    expect(
      screen.getByText(
        'A configuração foi alterada. Atualize a revisão antes de tentar novamente.',
      ),
    ).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar revisão' }))

    expect(refetchReview).toHaveBeenCalledTimes(2)
  })

  it('shows an active request instead of reporting that sending is ready', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          review: {
            formalizationId: 'formalization-1',
            version: 2,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'submitted',
              version: 1,
              openDocuments: 2,
              totalDocuments: 2,
            },
          },
        })}
      />,
    )

    expect(screen.getByText('Envio em andamento')).not.toBeNull()
    expect(
      (
        screen.getByRole('button', {
          name: 'Revisar e iniciar envio',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    expect(
      (
        screen.getByRole('button', {
          name: 'Redefinir configuração',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })

  it('does not render the active request card on the signatories tab', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration
    useFormalizationSendingConfigurationMock.mockReturnValue(
      createWidgetController({ activeTab: 'signatories' }),
    )

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          review: {
            formalizationId: 'formalization-1',
            version: 2,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'sending',
              version: 1,
              openDocuments: 2,
              totalDocuments: 2,
            },
          },
        })}
      />,
    )

    expect(screen.queryByText('Envio de assinaturas em andamento')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar envio' })).toBeNull()
  })

  it('keeps a confirmed request visible as a completed, read-only send', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          review: {
            formalizationId: 'formalization-1',
            version: 2,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'confirmed',
              version: 5,
              openDocuments: 0,
              totalDocuments: 2,
            },
          },
          status: {
            ...statusDefaults,
            requestId: 'request-1',
            status: 'confirmed',
            version: 5,
            totalDocuments: 2,
            completedDocuments: 2,
            failedDocuments: 0,
            canCancel: false,
            canRetry: false,
          },
        })}
      />,
    )

    expect(screen.getByText('Envio concluído')).not.toBeNull()
    expect(screen.getByText('Envio de assinaturas concluído')).not.toBeNull()
    expect(screen.getByText('2/2 documentos concluídos.')).not.toBeNull()
    expect(
      screen.getByText('Todos os documentos foram assinados e o envio foi concluído.'),
    ).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Revisar e iniciar envio' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar envio' })).toBeNull()
    expect(
      (
        screen.getByRole('button', {
          name: 'Redefinir configuração',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })

  it('cancels an active request with the current formalization version', async () => {
    const cancelSending = vi.fn().mockResolvedValue(undefined)
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={9}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          cancelSending,
          review: {
            formalizationId: 'formalization-1',
            version: 9,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'sending',
              version: 2,
              openDocuments: 2,
              totalDocuments: 2,
            },
          },
          status: {
            ...statusDefaults,
            requestId: 'request-1',
            status: 'sending',
            version: 2,
            totalDocuments: 2,
            completedDocuments: 0,
            failedDocuments: 0,
            canCancel: true,
            canRetry: false,
          },
        })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar envio' }))

    await waitFor(() => {
      expect(cancelSending).toHaveBeenCalledWith({
        expectedRequestVersion: 2,
        expectedFormalizationVersion: 9,
      })
    })
  })

  it('renders the cancellation error without hiding the active request', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={9}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          cancelError: new Error('cancel failed'),
          review: {
            formalizationId: 'formalization-1',
            version: 9,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'sending',
              version: 2,
              openDocuments: 2,
              totalDocuments: 2,
            },
          },
          status: {
            ...statusDefaults,
            requestId: 'request-1',
            status: 'sending',
            version: 2,
            totalDocuments: 2,
            completedDocuments: 0,
            failedDocuments: 0,
            canCancel: true,
            canRetry: false,
          },
        })}
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível cancelar o envio. Atualize e tente novamente.',
    )
    expect(screen.getByText('Envio de assinaturas em andamento')).not.toBeNull()
  })

  it('renders cancellation as pending and keeps reset locked until reconciliation', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={9}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          isCancellationPending: true,
          review: {
            formalizationId: 'formalization-1',
            version: 9,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'sending',
              version: 2,
              openDocuments: 2,
              totalDocuments: 2,
            },
          },
          status: {
            ...statusDefaults,
            requestId: 'request-1',
            status: 'sending',
            version: 2,
            totalDocuments: 2,
            completedDocuments: 0,
            failedDocuments: 0,
            canCancel: false,
            canRetry: false,
          },
        })}
      />,
    )

    expect(screen.getByText('Cancelamento do envio em andamento')).not.toBeNull()
    expect(
      screen.getByText('Revogando o envio e atualizando o estado do provedor...'),
    ).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar envio' })).toBeNull()
    expect(
      (
        screen.getByRole('button', {
          name: 'Redefinir configuração',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })

  it('renders a cancelled request as terminal instead of active', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={10}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          review: {
            formalizationId: 'formalization-1',
            version: 10,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'cancelled',
              version: 3,
              openDocuments: 2,
              totalDocuments: 2,
            },
          },
          status: {
            ...statusDefaults,
            requestId: 'request-1',
            status: 'cancelled',
            version: 3,
            totalDocuments: 2,
            completedDocuments: 0,
            failedDocuments: 0,
            canCancel: false,
            canRetry: false,
          },
        })}
      />,
    )

    expect(screen.getByText('Envio cancelado')).not.toBeNull()
    expect(screen.getByText('Envio de assinaturas cancelado')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar envio' })).toBeNull()
  })

  it('allows a rebuilt configuration to be sent after the previous request was cancelled', () => {
    const readyConfiguration = {
      ...configuration,
      version: 10,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={10}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          review: {
            formalizationId: 'formalization-1',
            version: 10,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'cancelled',
              version: 3,
              signatureConfigurationVersion: 7,
              openDocuments: 0,
              totalDocuments: 2,
            },
          },
        })}
      />,
    )

    expect(screen.getByText('Pronto para reenvio')).not.toBeNull()
    expect(
      screen.getByText(
        'O envio anterior foi cancelado. Revise os dados para iniciar um novo envio.',
      ),
    ).not.toBeNull()
    expect(
      (
        screen.getByRole('button', {
          name: 'Revisar e reenviar',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false)
  })

  it('shows the refreshed send state after editing a cancelled request', async () => {
    const resetSignatureConfiguration = vi.fn().mockResolvedValue(undefined)
    useFormalizationSendingConfigurationMock.mockImplementation(() => {
      const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
      return createWidgetController({ isResetDialogOpen, setIsResetDialogOpen })
    })
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration
    const cancelledReview: FormalizationSignatureSendingReviewResponse = {
      formalizationId: 'formalization-1',
      version: 10,
      status: 'ready_for_sending',
      ready: true,
      documents: [],
      signatories: [],
      messagePreview: 'Solicitação de assinatura da formalização.',
      issues: [],
      currentRequest: {
        id: 'request-1',
        status: 'cancelled',
        version: 3,
        openDocuments: 0,
        totalDocuments: 2,
      },
    }
    const { rerender } = render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={10}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController({ resetSignatureConfiguration })}
        sending={createSendingController({
          review: cancelledReview,
          status: {
            ...statusDefaults,
            requestId: 'request-1',
            status: 'cancelled',
            version: 3,
            totalDocuments: 2,
            completedDocuments: 0,
            failedDocuments: 0,
            canCancel: false,
            canRetry: false,
          },
        })}
      />,
    )

    expect(screen.getByText('Envio de assinaturas cancelado')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Redefinir configuração' }))
    const resetActions = screen.getAllByRole('button', {
      name: 'Redefinir configuração',
    })
    const confirmReset = resetActions.at(-1)
    if (!confirmReset) throw new Error('Expected the reset confirmation action')
    fireEvent.click(confirmReset)

    await waitFor(() => {
      expect(resetSignatureConfiguration).toHaveBeenCalledWith(10)
    })

    rerender(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={11}
        isPackageConfirmed
        configuration={{ ...readyConfiguration, version: 11 }}
        controller={createConfigurationController()}
        sending={createSendingController({
          review: {
            ...cancelledReview,
            version: 11,
            currentRequest: undefined,
            ready: false,
          },
          status: undefined,
        })}
      />,
    )

    expect(screen.queryByText('Envio de assinaturas cancelado')).toBeNull()
    expect(screen.getByText('Revisão necessária')).not.toBeNull()
    expect(
      (
        screen.getByRole('button', {
          name: 'Revisar e iniciar envio',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false)
  })

  it('keeps reset available after a cancelled send and delegates the current version', async () => {
    const resetSignatureConfiguration = vi.fn().mockResolvedValue(undefined)
    const handleTabChange = vi.fn()
    const currentVersion = 10
    const readyConfiguration = {
      ...configuration,
      version: currentVersion,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    useFormalizationSendingConfigurationMock.mockImplementation(() => {
      const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
      return createWidgetController({
        handleTabChange,
        isResetDialogOpen,
        setIsResetDialogOpen,
      })
    })

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={currentVersion}
        isPackageConfirmed
        configuration={readyConfiguration}
        controller={createConfigurationController({ resetSignatureConfiguration })}
        sending={createSendingController({
          review: {
            formalizationId: 'formalization-1',
            version: currentVersion,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
            currentRequest: {
              id: 'request-1',
              status: 'cancelled',
              version: 3,
              openDocuments: 0,
              totalDocuments: 2,
            },
          },
        })}
      />,
    )

    const resetButton = screen.getByRole('button', { name: 'Redefinir configuração' })
    expect((resetButton as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(resetButton)
    expect(screen.getByRole('alertdialog')).not.toBeNull()

    const resetActions = screen.getAllByRole('button', {
      name: 'Redefinir configuração',
    })
    const confirmReset = resetActions.at(-1)
    if (!confirmReset) throw new Error('Expected the reset confirmation action')
    fireEvent.click(confirmReset)

    await waitFor(() => {
      expect(resetSignatureConfiguration).toHaveBeenCalledWith(currentVersion)
      expect(handleTabChange).toHaveBeenCalledWith('signatories')
    })
  })

  it('reports read-only configurations instead of reporting that sending is ready', () => {
    const readyConfiguration = {
      ...configuration,
      status: 'ready_for_sending',
      readiness: { ready: true, assignmentCount: 2, issues: [] },
    } as unknown as FormalizationSignatureConfiguration

    render(
      <FormalizationSendingConfigurationPanel
        formalizationId='formalization-1'
        expectedVersion={2}
        isPackageConfirmed
        isReadOnly
        configuration={readyConfiguration}
        controller={createConfigurationController()}
        sending={createSendingController({
          review: {
            formalizationId: 'formalization-1',
            version: 2,
            status: 'ready_for_sending',
            ready: true,
            documents: [],
            signatories: [],
            messagePreview: 'Solicitação de assinatura da formalização.',
            issues: [],
          },
        })}
      />,
    )

    expect(screen.getByText('Somente leitura')).not.toBeNull()
    expect(
      (
        screen.getByRole('button', {
          name: 'Revisar e iniciar envio',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })
})

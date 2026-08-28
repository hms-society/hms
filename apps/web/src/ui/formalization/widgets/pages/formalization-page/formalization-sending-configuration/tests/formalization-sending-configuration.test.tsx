import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

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
        expectedVersion={2}
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

  it('keeps sending disabled even when configuration is ready', () => {
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

    expect(
      screen
        .getAllByRole('button', { name: /iniciar envio/i })
        .every((button) => (button as HTMLButtonElement).disabled),
    ).toBe(true)
  })
})

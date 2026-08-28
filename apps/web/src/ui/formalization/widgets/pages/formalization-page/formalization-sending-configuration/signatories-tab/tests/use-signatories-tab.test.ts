import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

import { useSignatoriesTab } from '../use-signatories-tab'
import { useFormalizationSignatureConfiguration } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

vi.mock(
  '@/ui/formalization/hooks/use-formalization-signature-configuration-action',
  () => ({
    useFormalizationSignatureConfiguration: vi.fn(),
  }),
)

const useConfigurationMock = vi.mocked(useFormalizationSignatureConfiguration)

const configuration = {
  formalizationId: 'formalization-1',
  version: 4,
  editable: true,
  status: 'configuring',
  documents: [],
  signatories: [
    {
      signatoryId: 'signatory-1',
      name: 'Cliente',
      role: 'client',
      removable: false,
      documentIds: ['document-1'],
      availableChannels: ['email'],
      selectedChannels: ['email'],
    },
    {
      signatoryId: 'signatory-2',
      name: 'Advogado',
      role: 'responsible_lawyer',
      removable: false,
      documentIds: ['document-1'],
      availableChannels: ['email'],
      selectedChannels: ['email'],
    },
  ],
} as unknown as FormalizationSignatureConfiguration

describe('useSignatoriesTab', () => {
  it('keeps document selections when a channel-only configuration update arrives', () => {
    useConfigurationMock.mockReturnValue({
      isReplacingSignatoryDocuments: false,
      selectSignatoryChannel: vi.fn(),
    } as unknown as FormalizationSignatureConfigurationController)

    const { result, rerender } = renderHook(
      ({ currentConfiguration }) =>
        useSignatoriesTab({
          formalizationId: 'formalization-1',
          expectedVersion: 4,
          configuration: currentConfiguration,
        }),
      { initialProps: { currentConfiguration: configuration } },
    )

    const channelConfiguration = {
      ...configuration,
      version: 5,
      signatories: configuration.signatories.map((signatory) =>
        signatory.signatoryId === 'signatory-1'
          ? { ...signatory, selectedChannels: ['email'] as const }
          : signatory,
      ),
    }

    rerender({ currentConfiguration: channelConfiguration })

    expect(result.current.selectedDocumentsBySignatory).toEqual({
      'signatory-1': ['document-1'],
      'signatory-2': ['document-1'],
    })
  })

  it('saves changed assignments sequentially with the returned version', async () => {
    const replaceSignatoryDocuments = vi
      .fn()
      .mockResolvedValueOnce({ ...configuration, version: 5 })
      .mockResolvedValueOnce({ ...configuration, version: 6 })
    const controller = {
      isReplacingSignatoryDocuments: false,
      replaceSignatoryDocuments,
    } as unknown as FormalizationSignatureConfigurationController
    useConfigurationMock.mockReturnValue(controller)
    const { result } = renderHook(() =>
      useSignatoriesTab({
        formalizationId: 'formalization-1',
        expectedVersion: 4,
        configuration,
      }),
    )

    act(() => {
      result.current.handleSelectedDocumentsChange('signatory-1', ['document-2'])
      result.current.handleSelectedDocumentsChange('signatory-2', ['document-2'])
    })
    await act(async () => {
      await result.current.handleSaveAssignments()
    })

    expect(replaceSignatoryDocuments).toHaveBeenNthCalledWith(1, {
      signatoryId: 'signatory-1',
      documentIds: ['document-2'],
      expectedVersion: 4,
    })
    expect(replaceSignatoryDocuments).toHaveBeenNthCalledWith(2, {
      signatoryId: 'signatory-2',
      documentIds: ['document-2'],
      expectedVersion: 5,
    })
  })

  it('uses the latest channel version when saving assignments', async () => {
    const selectSignatoryChannel = vi.fn().mockResolvedValue({
      ...configuration,
      version: 5,
    })
    const replaceSignatoryDocuments = vi.fn().mockResolvedValue({
      ...configuration,
      version: 6,
    })
    useConfigurationMock.mockReturnValue({
      isReplacingSignatoryDocuments: false,
      replaceSignatoryDocuments,
      selectSignatoryChannel,
    } as unknown as FormalizationSignatureConfigurationController)

    const { result } = renderHook(() =>
      useSignatoriesTab({
        formalizationId: 'formalization-1',
        expectedVersion: 4,
        configuration,
      }),
    )

    await act(async () => {
      await result.current.handleSelectChannel('signatory-1', 'email', false)
    })
    act(() => {
      result.current.handleSelectedDocumentsChange('signatory-1', ['document-2'])
    })
    await act(async () => {
      await result.current.handleSaveAssignments()
    })

    expect(selectSignatoryChannel).toHaveBeenCalledWith({
      signatoryId: 'signatory-1',
      channel: 'email',
      selected: false,
      expectedVersion: 4,
    })
    expect(replaceSignatoryDocuments).toHaveBeenCalledWith({
      signatoryId: 'signatory-1',
      documentIds: ['document-2'],
      expectedVersion: 5,
    })
  })

  it('disables assignment saving when any signatory is incomplete', () => {
    useConfigurationMock.mockReturnValue({
      isReplacingSignatoryDocuments: false,
    } as unknown as FormalizationSignatureConfigurationController)

    const incompleteConfiguration = {
      ...configuration,
      signatories: [
        ...configuration.signatories,
        {
          ...configuration.signatories[0],
          signatoryId: 'signatory-3',
          documentIds: [],
          selectedChannels: [],
        },
      ],
    }
    const { result } = renderHook(() =>
      useSignatoriesTab({
        formalizationId: 'formalization-1',
        expectedVersion: 4,
        configuration: incompleteConfiguration,
      }),
    )

    expect(result.current.canSaveAssignments).toBe(false)
  })

  it('disables assignment saving when the configuration is read-only', () => {
    useConfigurationMock.mockReturnValue({
      isReplacingSignatoryDocuments: false,
    } as unknown as FormalizationSignatureConfigurationController)

    const { result } = renderHook(() =>
      useSignatoriesTab({
        formalizationId: 'formalization-1',
        expectedVersion: 4,
        configuration: { ...configuration, editable: false },
      }),
    )

    expect(result.current.canSaveAssignments).toBe(false)
  })
})

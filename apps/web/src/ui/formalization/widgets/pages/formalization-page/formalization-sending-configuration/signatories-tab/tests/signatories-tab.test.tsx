import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

import { SignatoriesTab } from '..'
import {
  useFormalizationSignatureCandidatesQuery,
  useFormalizationSignatureConfiguration,
} from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

vi.mock(
  '@/ui/formalization/hooks/use-formalization-signature-configuration-action',
  () => ({
    useFormalizationSignatureCandidatesQuery: vi.fn(),
    useFormalizationSignatureConfiguration: vi.fn(),
  }),
)

const useCandidatesMock = vi.mocked(useFormalizationSignatureCandidatesQuery)
const useConfigurationMock = vi.mocked(useFormalizationSignatureConfiguration)

const configuration = {
  formalizationId: 'formalization-1',
  version: 2,
  editable: true,
  status: 'configuring',
  documents: [{ documentId: 'document-1', name: 'Contrato' }],
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

function fakeHook(
  overrides: Partial<FormalizationSignatureConfigurationController> = {},
) {
  return {
    isAddingSignatory: false,
    isRemovingSignatory: false,
    isReplacingSignatoryDocuments: false,
    isSelectingSignatoryChannel: false,
    addSignatory: vi.fn().mockResolvedValue(configuration),
    removeSignatory: vi.fn().mockResolvedValue(configuration),
    replaceSignatoryDocuments: vi.fn().mockResolvedValue(configuration),
    selectSignatoryChannel: vi.fn().mockResolvedValue(configuration),
    ...overrides,
  } as unknown as FormalizationSignatureConfigurationController
}

describe('SignatoriesTab', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    useConfigurationMock.mockReturnValue(fakeHook())
    useCandidatesMock.mockReturnValue({
      candidates: [],
      candidatePages: [],
      candidatesError: null,
      fetchNextCandidatesPage: vi.fn(),
      hasNextCandidatePage: false,
      isErrorCandidates: false,
      isFetchingCandidates: false,
      isFetchingNextCandidatesPage: false,
      isLoadingCandidates: false,
      refetchCandidates: vi.fn(),
    })
  })

  it('keeps one assignment-save button for the whole signatory list', () => {
    const replaceSignatoryDocuments = vi.fn().mockResolvedValue({
      ...configuration,
      version: 3,
    })
    useConfigurationMock.mockReturnValue(fakeHook({ replaceSignatoryDocuments }))

    render(
      <SignatoriesTab
        formalizationId='formalization-1'
        expectedVersion={2}
        configuration={configuration}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Salvar atribuições' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Salvar atribuições' })).toHaveProperty(
      'disabled',
      false,
    )
    expect(screen.getAllByText('Contrato')).toHaveLength(2)
    expect(screen.queryByText('document-1')).toBeNull()

    const secondDocumentCheckbox = document.getElementById('signatory-2-document-1')
    if (!secondDocumentCheckbox)
      throw new Error('Expected a document assignment checkbox')
    fireEvent.click(secondDocumentCheckbox)
    const saveButton = screen.getByRole('button', { name: 'Salvar atribuições' })
    expect(saveButton).toHaveProperty('disabled', true)

    fireEvent.click(saveButton)
    expect(replaceSignatoryDocuments).not.toHaveBeenCalled()
  })

  it('disables assignment saving when a signatory has no channel', () => {
    render(
      <SignatoriesTab
        formalizationId='formalization-1'
        expectedVersion={2}
        configuration={{
          ...configuration,
          signatories: configuration.signatories.map((signatory, index) =>
            index === 1 ? { ...signatory, selectedChannels: [] } : signatory,
          ),
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvar atribuições' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('keeps assignment saving available when multiple channels are selected', () => {
    render(
      <SignatoriesTab
        formalizationId='formalization-1'
        expectedVersion={2}
        configuration={{
          ...configuration,
          signatories: configuration.signatories.map((signatory) => ({
            ...signatory,
            availableChannels: ['email', 'whatsapp'],
            selectedChannels: ['email', 'whatsapp'],
          })),
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvar atribuições' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('disables assignment saving for a newly added incomplete signatory', () => {
    render(
      <SignatoriesTab
        formalizationId='formalization-1'
        expectedVersion={2}
        configuration={{
          ...configuration,
          signatories: [
            ...configuration.signatories,
            {
              ...configuration.signatories[0],
              signatoryId: 'signatory-3',
              name: 'Novo signatário',
              documentIds: [],
              selectedChannels: [],
            },
          ],
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvar atribuições' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('keeps assignment saving available while a channel request is pending', () => {
    useConfigurationMock.mockReturnValue(fakeHook({ isSelectingSignatoryChannel: true }))

    render(
      <SignatoriesTab
        formalizationId='formalization-1'
        expectedVersion={2}
        configuration={configuration}
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvar atribuições' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('keeps assignment saving available while previews are preparing', () => {
    render(
      <SignatoriesTab
        formalizationId='formalization-1'
        expectedVersion={2}
        configuration={{
          ...configuration,
          status: 'preparing_configuration',
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvar atribuições' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('keeps adding a signatory available when the configuration is not editable', () => {
    render(
      <SignatoriesTab
        formalizationId='formalization-1'
        expectedVersion={2}
        configuration={{ ...configuration, editable: false }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Adicionar signatário' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('keeps adding a signatory available while another add request is pending', () => {
    useConfigurationMock.mockReturnValue(fakeHook({ isAddingSignatory: true }))

    render(
      <SignatoriesTab
        formalizationId='formalization-1'
        expectedVersion={2}
        configuration={configuration}
      />,
    )

    expect(screen.getByRole('button', { name: 'Adicionar signatário' })).toHaveProperty(
      'disabled',
      false,
    )
  })
})

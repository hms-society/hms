import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'

import { SignatureFieldsTab } from '..'
import { useSignatureFieldsTab } from '../use-signature-fields-tab'

vi.mock('../use-signature-fields-tab', () => ({
  useSignatureFieldsTab: vi.fn(),
}))

const useSignatureFieldsTabMock = vi.mocked(useSignatureFieldsTab)

const configuration = {
  formalizationId: 'formalization-1',
  version: 4,
  editable: true,
  status: 'configuring',
  documents: [
    {
      documentId: 'document-1',
      name: 'Contrato',
      fields: [],
      preview: { previewId: 'preview-1', state: 'ready', pageCount: 1 },
    },
  ],
  signatories: [
    {
      signatoryId: 'signatory-1',
      name: 'Cliente HMS Teste',
      role: 'client',
      removable: false,
      documentIds: ['document-1'],
      availableChannels: ['email'],
    },
  ],
} as unknown as FormalizationSignatureConfiguration

function fakeHook(sourceConfiguration = configuration) {
  function getDocumentProgress(
    item: FormalizationSignatureConfiguration['documents'][number],
  ) {
    const documentSignatories = sourceConfiguration.signatories.filter((signatory) =>
      signatory.documentIds.includes(item.documentId),
    )
    const expectedSignatoryIds = documentSignatories.map(
      (signatory) => signatory.signatoryId,
    )
    const configuredSignatoryIds = new Set(item.fields.map((field) => field.signatoryId))

    return {
      configuredFields: item.fields,
      configuredSignatoriesCount: expectedSignatoryIds.filter((signatoryId) =>
        configuredSignatoryIds.has(signatoryId),
      ).length,
      documentSignatories,
      expectedSignatoryIds,
      hasAllExpectedFields:
        expectedSignatoryIds.length > 0 &&
        expectedSignatoryIds.every((signatoryId) =>
          configuredSignatoryIds.has(signatoryId),
        ),
    }
  }

  return {
    addField: vi.fn(),
    availableSignatories: configuration.signatories,
    canViewPreview: true,
    decreaseZoom: vi.fn(),
    documentId: 'document-1',
    fields: [],
    getDocumentProgress,
    handleConfirmDocumentChange: vi.fn(),
    handleDeleteField: vi.fn(),
    handleDocumentChangeDialogOpenChange: vi.fn(),
    handleFieldKeyDown: vi.fn(),
    handleFieldPointerCancel: vi.fn(),
    handleFieldPointerDown: vi.fn(),
    handleFieldPointerMove: vi.fn(),
    handleFieldPointerUp: vi.fn(),
    handleRemoveFieldPointerDown: vi.fn(),
    handleResizeKeyDown: vi.fn(),
    handleResizePointerDown: vi.fn(),
    handleResizePointerMove: vi.fn(),
    handleResizePointerUp: vi.fn(),
    increaseZoom: vi.fn(),
    isDirty: false,
    isDocumentChangeDialogOpen: false,
    isReadOnly: false,
    isReplacingSignatureFields: false,
    pageRef: { current: null },
    pageWidth: 480,
    persistLatest: vi.fn().mockResolvedValue(undefined),
    preview: configuration.documents[0]?.preview,
    previewContent: {
      previewContent: undefined,
      isLoadingPreviewContent: false,
      isFetchingPreviewContent: false,
      isErrorPreviewContent: false,
    },
    previewId: 'preview-1',
    previewUrl: undefined,
    replaceSignatureFieldsError: null,
    retrySignaturePreview: vi.fn(),
    isRetryingSignaturePreview: false,
    selectedPage: 1,
    selectedSignatoryId: 'signatory-1',
    selectDocument: vi.fn(),
    setSelectedPage: vi.fn(),
    setSelectedSignatoryId: vi.fn(),
    viewerRef: { current: null },
    zoom: 1,
  } as unknown as ReturnType<typeof useSignatureFieldsTab>
}

describe('SignatureFieldsTab', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useSignatureFieldsTabMock.mockReturnValue(fakeHook())
  })

  it('renders the editor controls from the owning hook', () => {
    render(<SignatureFieldsTab expectedVersion={4} configuration={configuration} />)

    expect(
      screen.getByRole('heading', { name: 'Posicione as assinaturas' }),
    ).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Adicionar campo' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    expect(screen.getByText('Tudo salvo')).not.toBeNull()
  })

  it('keeps a ready preview pending until every expected field is placed', () => {
    render(<SignatureFieldsTab expectedVersion={4} configuration={configuration} />)

    expect(screen.getByText('Pendente')).not.toBeNull()
    expect(screen.getByText('0/1 campo configurado')).not.toBeNull()
    expect(screen.queryByText('Pronto')).toBeNull()
  })

  it('displays configured fields as progress against assigned signatories', () => {
    const progressConfiguration = {
      ...configuration,
      signatories: [
        ...configuration.signatories,
        {
          signatoryId: 'signatory-2',
          name: 'Advogado',
          role: 'responsible_lawyer',
          removable: false,
          documentIds: ['document-1'],
          availableChannels: ['email'],
        },
        {
          signatoryId: 'signatory-3',
          name: 'Supervisor',
          role: 'supervisor',
          removable: false,
          documentIds: ['document-1'],
          availableChannels: ['email'],
        },
      ],
    } as unknown as FormalizationSignatureConfiguration

    useSignatureFieldsTabMock.mockReturnValue(fakeHook(progressConfiguration))

    render(
      <SignatureFieldsTab expectedVersion={4} configuration={progressConfiguration} />,
    )

    expect(screen.getByText('0/3 campos configurados')).not.toBeNull()
  })

  it('opens the assigned signatory progress from a document card', () => {
    render(<SignatureFieldsTab expectedVersion={4} configuration={configuration} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver campos de Contrato' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toBeNull()
    expect(within(dialog).getByText('Cliente HMS Teste')).not.toBeNull()
    expect(within(dialog).getByText('Não configurado')).not.toBeNull()
  })

  it('marks a document ready when every assigned signatory has a field', () => {
    const completeConfiguration = {
      ...configuration,
      documents: [
        {
          ...configuration.documents[0],
          fields: [
            {
              fieldId: 'field-1',
              signatoryId: 'signatory-1',
              previewId: 'preview-1',
              type: 'signature',
              page: 1,
              positionX: 10,
              positionY: 10,
              width: 24,
              height: 8,
            },
          ],
        },
      ],
    } as unknown as FormalizationSignatureConfiguration

    useSignatureFieldsTabMock.mockReturnValue(fakeHook(completeConfiguration))

    render(
      <SignatureFieldsTab expectedVersion={4} configuration={completeConfiguration} />,
    )

    expect(screen.getByText('Pronto')).not.toBeNull()
    expect(screen.getByText('1/1 campo configurado')).not.toBeNull()
  })

  it('counts duplicated fields once per assigned signatory', () => {
    const duplicatedConfiguration = {
      ...configuration,
      documents: [
        {
          ...configuration.documents[0],
          fields: [
            {
              fieldId: 'field-1',
              signatoryId: 'signatory-1',
              previewId: 'preview-1',
              type: 'signature',
              page: 1,
              positionX: 10,
              positionY: 10,
              width: 24,
              height: 8,
            },
            {
              fieldId: 'field-2',
              signatoryId: 'signatory-1',
              previewId: 'preview-1',
              type: 'signature',
              page: 1,
              positionX: 40,
              positionY: 10,
              width: 24,
              height: 8,
            },
            {
              fieldId: 'field-3',
              signatoryId: 'signatory-2',
              previewId: 'preview-1',
              type: 'signature',
              page: 1,
              positionX: 70,
              positionY: 10,
              width: 24,
              height: 8,
            },
          ],
        },
      ],
      signatories: [
        ...configuration.signatories,
        {
          signatoryId: 'signatory-2',
          name: 'Advogado',
          role: 'responsible_lawyer',
          removable: false,
          documentIds: ['document-1'],
          availableChannels: ['email'],
        },
      ],
    } as unknown as FormalizationSignatureConfiguration

    useSignatureFieldsTabMock.mockReturnValue(fakeHook(duplicatedConfiguration))

    render(
      <SignatureFieldsTab expectedVersion={4} configuration={duplicatedConfiguration} />,
    )

    expect(screen.getByText('Pronto')).not.toBeNull()
    expect(screen.getByText('2/2 campos configurados')).not.toBeNull()
  })

  it('renders a PDF skeleton while preview content is loading', () => {
    useSignatureFieldsTabMock.mockReturnValue({
      ...fakeHook(),
      previewContent: {
        previewContent: undefined,
        isLoadingPreviewContent: true,
        isFetchingPreviewContent: true,
        isErrorPreviewContent: true,
      },
    } as unknown as ReturnType<typeof useSignatureFieldsTab>)

    render(<SignatureFieldsTab expectedVersion={4} configuration={configuration} />)

    const loadingStatus = screen.getByRole('status', { name: 'Carregando PDF' })
    expect(loadingStatus.getAttribute('aria-busy')).toBe('true')
    expect(loadingStatus.querySelector('[data-slot="skeleton"]')).not.toBeNull()
    expect(screen.queryByText('Não foi possível carregar o PDF.')).toBeNull()
  })

  it('places the save action before the PDF viewer', () => {
    const hook = fakeHook()
    useSignatureFieldsTabMock.mockReturnValue(hook)
    render(<SignatureFieldsTab expectedVersion={4} configuration={configuration} />)

    const saveButton = screen.getByRole('button', { name: 'Salvar campos' })
    const viewer = screen.getByRole('region', { name: 'Visualização do PDF' })

    expect(
      saveButton.compareDocumentPosition(viewer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)

    fireEvent.click(saveButton)

    expect(hook.persistLatest).toHaveBeenCalledOnce()
  })

  it('delegates removing all fields to the owning hook', () => {
    const hook = {
      ...fakeHook(),
      fields: [
        {
          fieldId: 'field-1',
          signatoryId: 'signatory-1',
          previewId: 'preview-1',
          type: 'signature',
          page: 1,
          positionX: 10,
          positionY: 10,
          width: 24,
          height: 8,
        },
      ],
      handleRequestRemoveAllFields: vi.fn(),
      handleRemoveAllFields: vi.fn(),
      isRemoveAllFieldsDialogOpen: false,
      setIsRemoveAllFieldsDialogOpen: vi.fn(),
    }
    useSignatureFieldsTabMock.mockReturnValue(
      hook as unknown as ReturnType<typeof useSignatureFieldsTab>,
    )

    render(<SignatureFieldsTab expectedVersion={4} configuration={configuration} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remover todos os campos' }))

    expect(hook.handleRequestRemoveAllFields).toHaveBeenCalledOnce()
  })

  it('renders the unsaved document warning and delegates confirmation', () => {
    const hook = {
      ...fakeHook(),
      handleConfirmDocumentChange: vi.fn(),
      handleDocumentChangeDialogOpenChange: vi.fn(),
      isDocumentChangeDialogOpen: true,
    }
    useSignatureFieldsTabMock.mockReturnValue(
      hook as unknown as ReturnType<typeof useSignatureFieldsTab>,
    )

    render(<SignatureFieldsTab expectedVersion={4} configuration={configuration} />)

    expect(screen.getByText('Trocar de documento?')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Trocar documento' }))

    expect(hook.handleConfirmDocumentChange).toHaveBeenCalledOnce()
  })

  it('delegates field creation and zoom controls to the hook', () => {
    const hook = fakeHook()
    useSignatureFieldsTabMock.mockReturnValue(hook)
    render(<SignatureFieldsTab expectedVersion={4} configuration={configuration} />)

    const [addFieldButton] = screen.getAllByRole('button', { name: 'Adicionar campo' })
    if (!addFieldButton) throw new Error('Expected an add-field button')
    fireEvent.click(addFieldButton)
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar zoom' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reduzir zoom' }))

    expect(hook.addField).toHaveBeenCalledOnce()
    expect(hook.increaseZoom).toHaveBeenCalledOnce()
    expect(hook.decreaseZoom).toHaveBeenCalledOnce()
  })
})

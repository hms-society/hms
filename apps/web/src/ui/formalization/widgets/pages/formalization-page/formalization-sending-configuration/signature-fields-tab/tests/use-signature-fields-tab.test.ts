import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FormalizationSignatureFieldType,
  type FormalizationSignatureConfiguration,
} from '@hms/core/formalization/domain/structures'

import { useSignatureFieldsTab } from '../use-signature-fields-tab'
import {
  useFormalizationSignatureConfiguration,
  useFormalizationSignaturePreviewContentQuery,
} from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

vi.mock(
  '@/ui/formalization/hooks/use-formalization-signature-configuration-action',
  () => ({
    useFormalizationSignatureConfiguration: vi.fn(),
    useFormalizationSignaturePreviewContentQuery: vi.fn(),
  }),
)

const useConfigurationMock = vi.mocked(useFormalizationSignatureConfiguration)
const usePreviewContentMock = vi.mocked(useFormalizationSignaturePreviewContentQuery)

const field = {
  fieldId: 'field-1',
  signatoryId: 'signatory-1',
  previewId: 'preview-1',
  type: FormalizationSignatureFieldType.Signature,
  page: 1,
  positionX: 10,
  positionY: 10,
  width: 24,
  height: 8,
}

const configuration = {
  formalizationId: 'formalization-1',
  version: 4,
  editable: true,
  status: 'configuring',
  documents: [
    {
      documentId: 'document-1',
      name: 'Contrato',
      fields: [field],
      preview: { previewId: 'preview-1', state: 'ready', pageCount: 2 },
    },
    {
      documentId: 'document-2',
      name: 'Procuração',
      fields: [],
      preview: { previewId: 'preview-2', state: 'ready', pageCount: 1 },
    },
  ],
  signatories: [
    {
      signatoryId: 'signatory-1',
      name: 'Cliente',
      role: 'client',
      removable: false,
      documentIds: ['document-1'],
      availableChannels: ['email'],
    },
  ],
} as unknown as FormalizationSignatureConfiguration

function fakeHook(overrides: Record<string, unknown> = {}) {
  return {
    isReplacingSignatureFields: false,
    replaceSignatureFields: vi.fn().mockResolvedValue(configuration),
    replaceSignatureFieldsError: null,
    isRetryingSignaturePreview: false,
    retrySignaturePreview: vi.fn().mockResolvedValue(configuration),
    ...overrides,
  } as unknown as ReturnType<typeof useFormalizationSignatureConfiguration>
}

describe('useSignatureFieldsTab', () => {
  beforeEach(() => {
    useConfigurationMock.mockReturnValue(fakeHook())
    usePreviewContentMock.mockReturnValue({
      previewContent: undefined,
      previewContentError: null,
      isLoadingPreviewContent: false,
      isFetchingPreviewContent: false,
      isErrorPreviewContent: false,
      refetchPreviewContent: vi.fn(),
    })
  })

  it('owns field creation, keyboard movement, deletion, and zoom state', () => {
    const editableConfiguration = {
      ...configuration,
      documents: configuration.documents.map((document) =>
        document.documentId === 'document-1' ? { ...document, fields: [] } : document,
      ),
    } as FormalizationSignatureConfiguration
    const { result } = renderHook(() =>
      useSignatureFieldsTab({ expectedVersion: 4, configuration: editableConfiguration }),
    )

    expect(result.current.isReadOnly).toBe(false)
    act(() => result.current.addField())
    expect(result.current.fields).toHaveLength(1)
    expect(result.current.fields[0]?.height).toBe(4)
    expect(result.current.isDirty).toBe(true)

    act(() => result.current.addField())
    expect(result.current.fields).toHaveLength(2)
    expect(result.current.isReadOnly).toBe(false)

    const fieldId = result.current.fields[0]?.fieldId
    const secondFieldId = result.current.fields[1]?.fieldId
    if (!fieldId) throw new Error('Expected the created field to have an ID')
    if (!secondFieldId) throw new Error('Expected the second created field to have an ID')
    act(() =>
      result.current.handleFieldKeyDown(fieldId, {
        key: 'ArrowRight',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent<HTMLButtonElement>),
    )
    expect(result.current.fields[0]?.positionX).toBe(11)

    act(() => result.current.handleDeleteField(fieldId))
    act(() => result.current.handleDeleteField(secondFieldId))
    expect(result.current.fields).toHaveLength(0)

    act(() => result.current.increaseZoom())
    expect(result.current.zoom).toBe(1.25)
    act(() => result.current.decreaseZoom())
    expect(result.current.zoom).toBe(1)
  })

  it('keeps field editing read-only while previews are preparing', () => {
    const preparingConfiguration = {
      ...configuration,
      status: 'preparing_configuration',
      documents: configuration.documents.map((document) =>
        document.documentId === 'document-1' ? { ...document, fields: [] } : document,
      ),
    } as FormalizationSignatureConfiguration
    const { result } = renderHook(() =>
      useSignatureFieldsTab({
        expectedVersion: 4,
        configuration: preparingConfiguration,
      }),
    )

    expect(result.current.isReadOnly).toBe(true)
    act(() => result.current.addField())
    expect(result.current.fields).toHaveLength(0)
  })

  it('persists the active document field snapshot with the expected version', async () => {
    const replaceSignatureFields = vi.fn().mockResolvedValue({
      ...configuration,
      version: 5,
    })
    useConfigurationMock.mockReturnValue(fakeHook({ replaceSignatureFields }))

    const editableConfiguration = {
      ...configuration,
      documents: configuration.documents.map((document) =>
        document.documentId === 'document-1' ? { ...document, fields: [] } : document,
      ),
    } as FormalizationSignatureConfiguration
    const { result } = renderHook(() =>
      useSignatureFieldsTab({ expectedVersion: 4, configuration: editableConfiguration }),
    )

    act(() => result.current.addField())
    await act(async () => {
      await result.current.persistLatest()
    })

    expect(replaceSignatureFields).toHaveBeenCalledWith({
      documentId: 'document-1',
      previewId: 'preview-1',
      fields: [expect.objectContaining({ signatoryId: 'signatory-1' })],
      expectedVersion: 4,
    })
    expect(result.current.isDirty).toBe(false)
  })

  it('allows reopening the editor when saved fields are present', () => {
    const { result } = renderHook(() =>
      useSignatureFieldsTab({ expectedVersion: 4, configuration }),
    )

    act(() => result.current.addField())

    expect(result.current.isReadOnly).toBe(false)
    expect(result.current.fields).toHaveLength(2)
    expect(result.current.isDirty).toBe(true)
  })

  it('counts duplicate fields once in document progress', () => {
    const duplicatedConfiguration = {
      ...configuration,
      documents: [
        {
          ...configuration.documents[0],
          fields: [field, { ...field, fieldId: 'field-2' }],
        },
      ],
    } as FormalizationSignatureConfiguration
    const { result } = renderHook(() =>
      useSignatureFieldsTab({
        expectedVersion: 4,
        configuration: duplicatedConfiguration,
      }),
    )

    const progress = result.current.getDocumentProgress(
      duplicatedConfiguration.documents[0],
    )

    expect(progress.configuredFields).toHaveLength(2)
    expect(progress.configuredSignatoriesCount).toBe(1)
    expect(progress.expectedSignatoryIds).toEqual(['signatory-1'])
    expect(progress.hasAllExpectedFields).toBe(true)
  })

  it('removes all fields from the active document after confirmation', () => {
    const { result } = renderHook(() =>
      useSignatureFieldsTab({ expectedVersion: 4, configuration }),
    )

    act(() => result.current.handleRequestRemoveAllFields())
    expect(result.current.isRemoveAllFieldsDialogOpen).toBe(true)

    act(() => result.current.handleRemoveAllFields())

    expect(result.current.fields).toEqual([])
    expect(result.current.isDirty).toBe(true)
    expect(result.current.isRemoveAllFieldsDialogOpen).toBe(false)
  })

  it('does not remove fields from a read-only document', () => {
    const readOnlyConfiguration = {
      ...configuration,
      editable: false,
    } as FormalizationSignatureConfiguration
    const { result } = renderHook(() =>
      useSignatureFieldsTab({ expectedVersion: 4, configuration: readOnlyConfiguration }),
    )

    act(() => result.current.handleRequestRemoveAllFields())
    act(() => result.current.handleRemoveAllFields())

    expect(result.current.fields).toHaveLength(1)
    expect(result.current.isRemoveAllFieldsDialogOpen).toBe(false)
  })

  it('uses the returned version when a save is queued during an in-flight save', async () => {
    let resolveFirstSave: (value: FormalizationSignatureConfiguration) => void = () => {}
    const firstSave = new Promise<FormalizationSignatureConfiguration>((resolve) => {
      resolveFirstSave = resolve
    })
    const replaceSignatureFields = vi
      .fn()
      .mockReturnValueOnce(firstSave)
      .mockResolvedValueOnce({ ...configuration, version: 6 })
    useConfigurationMock.mockReturnValue(fakeHook({ replaceSignatureFields }))

    const editableConfiguration = {
      ...configuration,
      documents: configuration.documents.map((document) =>
        document.documentId === 'document-1' ? { ...document, fields: [] } : document,
      ),
    } as FormalizationSignatureConfiguration
    const { result } = renderHook(() =>
      useSignatureFieldsTab({ expectedVersion: 4, configuration: editableConfiguration }),
    )

    act(() => result.current.addField())
    const firstPersist = result.current.persistLatest()
    await act(async () => {
      await Promise.resolve()
    })

    const fieldId = result.current.fields[0]?.fieldId
    if (!fieldId) throw new Error('Expected the created field to have an ID')
    act(() => result.current.handleDeleteField(fieldId))
    await act(async () => {
      await result.current.persistLatest()
    })

    resolveFirstSave({ ...configuration, version: 5 })
    await act(async () => {
      await firstPersist
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(replaceSignatureFields).toHaveBeenNthCalledWith(1, {
      documentId: 'document-1',
      previewId: 'preview-1',
      fields: [expect.objectContaining({ signatoryId: 'signatory-1' })],
      expectedVersion: 4,
    })
    expect(replaceSignatureFields).toHaveBeenNthCalledWith(2, {
      documentId: 'document-1',
      previewId: 'preview-1',
      fields: [],
      expectedVersion: 5,
    })
  })

  it('does not allow adding a field for an unassigned document signatory', () => {
    const { result } = renderHook(() =>
      useSignatureFieldsTab({ expectedVersion: 4, configuration }),
    )

    act(() => result.current.selectDocument('document-2'))
    act(() => result.current.addField())

    expect(result.current.availableSignatories).toHaveLength(0)
    expect(result.current.selectedSignatoryId).toBe('')
    expect(result.current.fields).toHaveLength(0)
    expect(result.current.isDirty).toBe(false)
  })

  it('prompts before switching documents with unsaved fields and preserves the draft', () => {
    const editableConfiguration = {
      ...configuration,
      documents: configuration.documents.map((document) =>
        document.documentId === 'document-1' ? { ...document, fields: [] } : document,
      ),
    } as FormalizationSignatureConfiguration
    const { result } = renderHook(() =>
      useSignatureFieldsTab({ expectedVersion: 4, configuration: editableConfiguration }),
    )

    act(() => result.current.addField())
    act(() => result.current.selectDocument('document-2'))

    expect(result.current.isDocumentChangeDialogOpen).toBe(true)
    expect(result.current.documentId).toBe('document-1')

    act(() => result.current.handleConfirmDocumentChange())
    act(() => result.current.selectDocument('document-1'))

    expect(result.current.documentId).toBe('document-1')
    expect(result.current.fields).toHaveLength(1)
    expect(result.current.isDirty).toBe(true)
  })

  it('notifies the parent whenever field changes become unsaved', () => {
    const onUnsavedChangesChange = vi.fn()
    const editableConfiguration = {
      ...configuration,
      documents: configuration.documents.map((document) =>
        document.documentId === 'document-1' ? { ...document, fields: [] } : document,
      ),
    } as FormalizationSignatureConfiguration
    const { result } = renderHook(() =>
      useSignatureFieldsTab({
        expectedVersion: 4,
        configuration: editableConfiguration,
        onUnsavedChangesChange,
      }),
    )

    expect(onUnsavedChangesChange).toHaveBeenLastCalledWith(false)
    act(() => result.current.addField())

    expect(onUnsavedChangesChange).toHaveBeenLastCalledWith(true)
  })
})

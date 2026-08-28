import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FormalizationSignatureFieldType } from '@hms/core/formalization/domain/structures'

import { useSignatureFieldsProgressDialog } from '../use-signature-fields-progress-dialog'

const fields = [
  {
    fieldId: 'field-1',
    signatoryId: 'signatory-1',
    previewId: 'preview-1',
    type: FormalizationSignatureFieldType.Signature,
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
    type: FormalizationSignatureFieldType.Signature,
    page: 1,
    positionX: 40,
    positionY: 10,
    width: 24,
    height: 8,
  },
] as const

const signatories = [
  { signatoryId: 'signatory-1', name: 'Cliente HMS Teste' },
  { signatoryId: 'signatory-2', name: 'Marina Costa' },
] as const

describe('useSignatureFieldsProgressDialog', () => {
  it('derives field status for every assigned signatory and controls visibility', () => {
    const { result } = renderHook(() =>
      useSignatureFieldsProgressDialog({
        documentName: 'Contrato de formalização',
        fields,
        signatories,
      }),
    )

    expect(result.current.open).toBe(false)
    expect(result.current.configuredSignatoriesCount).toBe(1)
    expect(result.current.signatoryStatuses).toEqual([
      { ...signatories[0], isConfigured: true },
      { ...signatories[1], isConfigured: false },
    ])

    act(() => result.current.handleOpenChange(true))
    expect(result.current.open).toBe(true)

    act(() => result.current.handleOpenChange(false))
    expect(result.current.open).toBe(false)
  })
})

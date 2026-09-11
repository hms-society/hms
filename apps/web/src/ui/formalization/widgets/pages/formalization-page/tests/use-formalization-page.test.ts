import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCloseFormalizationWithoutContractAction } from '@/ui/formalization/hooks/use-close-formalization-without-contract-action'
import { useFormalizationDocumentProduction } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useFormalizationQuery } from '@/ui/formalization/hooks/use-formalization-query'
import { useSaveFormalizationContractFormAction } from '@/ui/formalization/hooks/use-save-formalization-contract-form-action'
import { useFormalizationSignatureConfiguration } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
import { useFormalizationSignatureSending } from '@/ui/formalization/hooks/use-formalization-signature-sending-action'

import { useFormalizationPage } from '../use-formalization-page'

vi.mock(
  '@/ui/formalization/hooks/use-close-formalization-without-contract-action',
  () => ({ useCloseFormalizationWithoutContractAction: vi.fn() }),
)
vi.mock('@/ui/formalization/hooks/use-formalization-document-production-action', () => ({
  useFormalizationDocumentProduction: vi.fn(),
}))
vi.mock('@/ui/formalization/hooks/use-formalization-query', () => ({
  useFormalizationQuery: vi.fn(),
}))
vi.mock('@/ui/formalization/hooks/use-save-formalization-contract-form-action', () => ({
  useSaveFormalizationContractFormAction: vi.fn(),
}))
vi.mock(
  '@/ui/formalization/hooks/use-formalization-signature-configuration-action',
  () => ({ useFormalizationSignatureConfiguration: vi.fn() }),
)
vi.mock('@/ui/formalization/hooks/use-formalization-signature-sending-action', () => ({
  useFormalizationSignatureSending: vi.fn(),
}))

const query = vi.mocked(useFormalizationQuery)
const production = vi.mocked(useFormalizationDocumentProduction)
const save = vi.mocked(useSaveFormalizationContractFormAction)
const configuration = vi.mocked(useFormalizationSignatureConfiguration)
const sending = vi.mocked(useFormalizationSignatureSending)
const close = vi.mocked(useCloseFormalizationWithoutContractAction)

describe('useFormalizationPage', () => {
  it('exposes Intake and request versions to the contracting controller path', () => {
    const formalization = {
      version: 8,
      contractFormState: 'closed',
      contractFormAnswers: [{ fieldId: 'field-1', value: 'yes' }],
    }
    const queryState = { data: { formalization, intake: { version: 12 } } }
    const replaceForm = vi.fn()
    const closeMutate = vi.fn()
    query.mockReturnValue(queryState as never)
    production.mockReturnValue({ isPackageConfirmed: true } as never)
    save.mockReturnValue({ replaceForm: { mutate: replaceForm } } as never)
    configuration.mockReturnValue({} as never)
    sending.mockReturnValue({
      status: { requestId: 'request-1', status: 'sent' },
    } as never)
    close.mockReturnValue({ mutate: closeMutate } as never)

    const { result } = renderHook(() => useFormalizationPage('formalization-1'))

    expect(result.current.effectiveAnswers).toEqual({ 'field-1': 'yes' })
    expect(result.current.isSignatureSendingLocked).toBe(true)
    act(() =>
      result.current.closeWithoutContract.mutate({ closureNotes: 'notes' } as never),
    )
    expect(closeMutate).toHaveBeenCalledWith({
      closureNotes: 'notes',
      expectedIntakeVersion: 12,
      expectedVersion: 8,
    })
  })

  it('does not issue versioned mutations without a loaded aggregate', () => {
    const replaceForm = vi.fn()
    query.mockReturnValue({ data: undefined } as never)
    production.mockReturnValue({ isPackageConfirmed: false } as never)
    save.mockReturnValue({ replaceForm: { mutate: replaceForm } } as never)
    configuration.mockReturnValue({} as never)
    sending.mockReturnValue({} as never)
    close.mockReturnValue({ mutate: vi.fn() } as never)

    const { result } = renderHook(() => useFormalizationPage('formalization-1'))
    act(() => result.current.replaceForm('form-2'))
    expect(replaceForm).not.toHaveBeenCalled()
  })
})

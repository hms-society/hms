import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFormalizationDocumentProduction } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useFormalizationQuery } from '@/ui/formalization/hooks/use-formalization-query'
import { useFormalizationSignatureConfiguration } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
import { useFormalizationSignatureSending } from '@/ui/formalization/hooks/use-formalization-signature-sending-action'

import { useFormalizationSendingConfigurationPage } from '../use-formalization-sending-configuration-page'

vi.mock('@/ui/formalization/hooks/use-formalization-document-production-action', () => ({
  useFormalizationDocumentProduction: vi.fn(),
}))
vi.mock('@/ui/formalization/hooks/use-formalization-query', () => ({
  useFormalizationQuery: vi.fn(),
}))
vi.mock(
  '@/ui/formalization/hooks/use-formalization-signature-configuration-action',
  () => ({
    useFormalizationSignatureConfiguration: vi.fn(),
  }),
)
vi.mock('@/ui/formalization/hooks/use-formalization-signature-sending-action', () => ({
  useFormalizationSignatureSending: vi.fn(),
}))

const query = vi.mocked(useFormalizationQuery)
const production = vi.mocked(useFormalizationDocumentProduction)
const configuration = vi.mocked(useFormalizationSignatureConfiguration)
const sending = vi.mocked(useFormalizationSignatureSending)

describe('useFormalizationSendingConfigurationPage', () => {
  it('coordinates independent full, package and sending status controllers', () => {
    const queryState = { data: { formalization: { contractFormState: 'closed' } } }
    const productionState = { isPackageConfirmed: true }
    const configurationState = { configuration: { version: 3 } }
    const sendingState = { status: { requestId: 'request-1' } }
    query.mockReturnValue(queryState as never)
    production.mockReturnValue(productionState as never)
    configuration.mockReturnValue(configurationState as never)
    sending.mockReturnValue(sendingState as never)

    const { result } = renderHook(() =>
      useFormalizationSendingConfigurationPage('formalization-1'),
    )

    expect(production).toHaveBeenCalledWith('formalization-1', true)
    expect(configuration).toHaveBeenCalledWith('formalization-1', true)
    expect(sending).toHaveBeenCalledWith('formalization-1', true)
    expect(result.current).toMatchObject({
      query: queryState,
      documentProduction: productionState,
      signatureConfiguration: configurationState,
      signatureSending: sendingState,
      formalization: queryState.data.formalization,
    })
  })
})

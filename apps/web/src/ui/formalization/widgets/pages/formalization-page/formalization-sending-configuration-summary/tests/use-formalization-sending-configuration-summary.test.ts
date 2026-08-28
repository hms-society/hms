import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

import { useFormalizationSendingConfigurationSummary } from '../use-formalization-sending-configuration-summary'

describe('useFormalizationSendingConfigurationSummary', () => {
  it('derives summary metrics and ready status', () => {
    const { result } = renderHook(() =>
      useFormalizationSendingConfigurationSummary({
        formalizationId: 'formalization-1',
        isPackageConfirmed: true,
        configuration: {
          status: 'ready_for_sending',
          signatories: [{ id: 'signatory-1' }],
          documents: [{ id: 'document-1' }],
          readiness: { assignmentCount: 1 },
        } as unknown as FormalizationSignatureConfiguration,
        controller: {
          isConfigurationError: false,
        } as unknown as FormalizationSignatureConfigurationController,
      }),
    )

    expect(result.current.statusLabel).toBe('Pronto para envio')
    expect(result.current.metrics).toEqual([
      { label: 'Signatários', value: '1' },
      { label: 'Documentos', value: '1' },
      { label: 'Atribuições', value: '1' },
    ])
  })
})

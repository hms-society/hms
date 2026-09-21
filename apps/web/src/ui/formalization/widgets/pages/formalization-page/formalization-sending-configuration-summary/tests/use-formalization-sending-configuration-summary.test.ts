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
    expect(result.current.badgeVariant).toBe('success')
    expect(result.current.title).toBe('Pronto para revisar')
    expect(result.current.metrics).toEqual([
      { label: 'Signatários', value: '1' },
      { label: 'Documentos', value: '1' },
      { label: 'Atribuições', value: '1' },
    ])
  })

  it('shows the confirmed signature status over the configuration status', () => {
    const { result } = renderHook(() =>
      useFormalizationSendingConfigurationSummary({
        formalizationId: 'formalization-1',
        isPackageConfirmed: true,
        signatureStatus: 'confirmed',
        configuration: {
          status: 'ready_for_sending',
          signatories: [],
          documents: [],
          readiness: { assignmentCount: 0 },
        } as unknown as FormalizationSignatureConfiguration,
        controller: {
          isConfigurationError: false,
        } as unknown as FormalizationSignatureConfigurationController,
      }),
    )

    expect(result.current.statusLabel).toBe('Confirmado')
    expect(result.current.title).toBe('Assinaturas confirmadas')
    expect(result.current.hasSignatureRequest).toBe(true)
  })

  it.each([
    'sent',
    'in_progress',
    'partially_submitted',
    'submitted',
  ] as const)('shows the invitation tracking state when the request is %s', (signatureStatus) => {
    const { result } = renderHook(() =>
      useFormalizationSendingConfigurationSummary({
        formalizationId: 'formalization-1',
        isPackageConfirmed: true,
        signatureStatus,
        configuration: {
          status: 'read_only',
          signatories: [],
          documents: [],
          readiness: { assignmentCount: 0 },
        } as unknown as FormalizationSignatureConfiguration,
        controller: {
          isConfigurationError: false,
        } as unknown as FormalizationSignatureConfigurationController,
      }),
    )

    expect(result.current.statusLabel).toBe('Envio em andamento')
    expect(result.current.badgeVariant).toBe('attention')
    expect(result.current.title).toBe('Convites enviados')
    expect(result.current.description).toContain('Os convites foram enviados')
  })

  it('shows sending feedback while invitations are being dispatched', () => {
    const { result } = renderHook(() =>
      useFormalizationSendingConfigurationSummary({
        formalizationId: 'formalization-1',
        isPackageConfirmed: true,
        signatureStatus: 'sending',
        configuration: undefined,
        controller: {
          isConfigurationError: false,
        } as unknown as FormalizationSignatureConfigurationController,
      }),
    )

    expect(result.current.statusLabel).toBe('Envio em andamento')
    expect(result.current.badgeVariant).toBe('attention')
    expect(result.current.title).toBe('Envio dos convites em andamento')
  })
})

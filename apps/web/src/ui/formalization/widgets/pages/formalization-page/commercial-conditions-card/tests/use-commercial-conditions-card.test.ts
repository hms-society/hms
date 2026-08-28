import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCommercialConditionsCard } from '../use-commercial-conditions-card'

describe('useCommercialConditionsCard', () => {
  it('resolves conditional requiredness through field IDs, not field keys', () => {
    const fields = [
      {
        id: 'choice-id',
        key: 'choice-key',
        label: 'Escolha',
        type: 'single_selection' as const,
        position: 1,
        required: true,
        options: [{ value: 'yes', label: 'Sim', position: 1 }],
      },
      {
        id: 'details-id',
        key: 'details-key',
        label: 'Detalhes',
        type: 'short_text' as const,
        position: 2,
        required: false,
        validation: { requiredWhen: { fieldKey: 'choice-key', equals: 'yes' } },
      },
    ]

    const { result } = renderHook(() =>
      useCommercialConditionsCard(fields, { 'choice-id': 'yes' }),
    )

    expect(result.current.completion).toEqual({ answeredCount: 1, requiredCount: 2 })
    expect(result.current.errors['field:details-id']).toBe('Preencha este campo.')
  })
})

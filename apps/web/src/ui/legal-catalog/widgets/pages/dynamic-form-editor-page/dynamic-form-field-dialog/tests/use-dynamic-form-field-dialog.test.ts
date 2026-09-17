import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormFieldDialog } from '../use-dynamic-form-field-dialog'
import { fieldToRequest } from '../../types'

function renderField(
  initialValue: Parameters<typeof useDynamicFormFieldDialog>[0]['initialValue'],
) {
  const onSubmit = vi.fn()
  const hook = renderHook(() =>
    useDynamicFormFieldDialog({
      open: true,
      mode: 'create',
      stage: 'formalization',
      legalAreaName: 'Cível',
      legalTopicNames: ['Contratos'],
      initialValue,
      onOpenChange: vi.fn(),
      onSubmit,
    }),
  )
  return { ...hook, onSubmit }
}

describe('use-dynamic-form-field-dialog', () => {
  it('keeps only Core-compatible numeric validation in requests', () => {
    const currencyRequest = fieldToRequest({
      clientId: 'currency-1',
      label: 'Valor',
      type: 'currency',
      required: false,
      currency: 'BRL',
      defaultValue: 1250.5,
      validation: { min: 1000 },
    })
    const percentageRequest = fieldToRequest({
      clientId: 'percentage-1',
      label: 'Percentual',
      type: 'percentage',
      required: false,
      defaultValue: 12.5,
      validation: { min: 0, max: 100, scale: 2 },
    })

    expect(Object.hasOwn(currencyRequest, 'validation')).toBe(false)
    expect(percentageRequest.validation).toEqual({ scale: 2 })
  })

  it('does not commit duplicate options or invalid default pointers', () => {
    const { result, onSubmit } = renderField({
      clientId: 'field-1',
      label: 'Contrato',
      type: 'multiple_selection',
      required: true,
      options: [
        { clientId: 'option-1', label: 'Ativo' },
        { clientId: 'option-2', label: ' ativo ' },
      ],
      defaultOptionClientIds: ['missing-option'],
    })

    act(() => result.current.submit())

    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.optionErrors).toEqual([
      {
        optionClientId: 'option-2',
        message: 'Os rótulos das opções devem ser únicos.',
      },
    ])
    expect(result.current.errors.defaultValue).toBe(
      'Selecione uma opção válida como padrão.',
    )
  })

  it('maps invalid dates to the default value control without committing', () => {
    const { result, onSubmit } = renderField({
      clientId: 'field-1',
      label: 'Data de assinatura',
      type: 'date',
      required: false,
      defaultValue: '2024-02-30',
    })

    act(() => result.current.submit())

    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.defaultValue).toBeTruthy()
  })

  it('maps numeric range and precision errors to numeric controls', () => {
    const range = renderField({
      clientId: 'integer-1',
      label: 'Parcelas',
      type: 'integer',
      required: false,
      validation: { min: 10, max: 5 },
    })
    act(() => range.result.current.submit())
    expect(range.onSubmit).not.toHaveBeenCalled()
    expect(range.result.current.errors.validation).toBe(
      'O mínimo não pode ser maior que o máximo.',
    )

    const precision = renderField({
      clientId: 'percentage-1',
      label: 'Percentual',
      type: 'percentage',
      required: false,
      defaultValue: 12.345,
      validation: { scale: 2 },
    })
    act(() => precision.result.current.submit())
    expect(precision.onSubmit).not.toHaveBeenCalled()
    expect(precision.result.current.errors.defaultValue).toBeTruthy()
  })
})

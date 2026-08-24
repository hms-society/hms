import { act, renderHook } from '@testing-library/react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import type { ClientDetails } from '@hms/core/identity/domain/entities'
import type { IntakeFormData } from '@hms/validation/intake'

import { useClientStep } from '../use-client-step'

const clientDetails = {
  client: {
    id: 'client-id',
    type: 'natural',
    name: 'Maria Aparecida',
    taxId: { type: 'cpf', value: '52998224725' },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  consents: [],
} satisfies ClientDetails

describe('useClientStep', () => {
  it('clears the client error when opening the identification dialog', () => {
    let form!: UseFormReturn<IntakeFormData>

    const { result } = renderHook(() => useClientStep(), {
      wrapper: function ClientStepTestProvider({ children }: PropsWithChildren) {
        form = useForm<IntakeFormData>({ defaultValues: { clientId: '' } })
        return <FormProvider {...form}>{children}</FormProvider>
      },
    })

    act(() => {
      form.setError('clientId', {
        type: 'manual',
        message: 'Vincule ou cadastre uma pessoa antes de continuar',
      })
      result.current.handleClientDialogChange(true)
    })

    expect(result.current.error).toBeUndefined()
  })

  it('keeps the current client while the replacement dialog is open', () => {
    let form!: UseFormReturn<IntakeFormData>

    const { result } = renderHook(() => useClientStep(), {
      wrapper: function ClientStepTestProvider({ children }: PropsWithChildren) {
        form = useForm<IntakeFormData>({ defaultValues: { clientId: '' } })
        return <FormProvider {...form}>{children}</FormProvider>
      },
    })

    act(() => {
      result.current.handleClientSelected(clientDetails)
      result.current.handleChangeClient()
    })

    expect(result.current.clientId).toBe('client-id')
    expect(result.current.clientName).toBe('Maria Aparecida')
    expect(result.current.isClientDialogOpen).toBe(true)
  })
})

import { act, renderHook } from '@testing-library/react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import type { IntakeFormData } from '@hms/validation/intake'

import { useClientStep } from '../use-client-step'

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
})

import { useCallback } from 'react'

export function useMaskTaxId() {
  return useCallback(function maskTaxId(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length > 11) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }, [])
}

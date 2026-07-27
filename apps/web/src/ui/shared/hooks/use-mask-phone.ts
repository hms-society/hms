import { useCallback } from 'react'

export function useMaskPhone() {
  return useCallback(function maskPhone(value?: string) {
    if (!value) return ''
    const digits = value.replace(/\D/g, '').slice(0, 13)
    if (digits.length > 10) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }, [])
}

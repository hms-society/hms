import { useCallback } from 'react'

export function useMaskPhone() {
  return useCallback(function maskPhone(value?: string) {
    if (!value) return ''
    let digits = value.replace(/\D/g, '').slice(0, 13)
    if (digits.length === 11 && !digits.startsWith('55')) {
      digits = `55${digits}`
    }
    if (digits.length === 13 && digits.startsWith('55')) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
    }
    if (digits.length > 10) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }, [])
}

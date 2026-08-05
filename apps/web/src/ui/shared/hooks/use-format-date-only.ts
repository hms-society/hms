import { useCallback } from 'react'

export function useFormatDateOnly() {
  return useCallback(function formatDateOnly(date: Date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
  }, [])
}

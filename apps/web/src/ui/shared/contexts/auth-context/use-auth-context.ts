import { useContext } from 'react'

import { AppError } from '@hms/core/shared/domain/errors'

import { AuthContext } from './index'
import type { AuthContextValue } from './types'

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new AppError('useAuthContext must be used inside AuthContextProvider')
  }

  return context
}

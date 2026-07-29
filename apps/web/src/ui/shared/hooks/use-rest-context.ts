import { useContext } from 'react'

import { AppError } from '@hms/core/shared/domain/errors'

import { RestContext } from '../contexts/rest-context'

export function useRestContext() {
  const context = useContext(RestContext)

  if (!context) {
    throw new AppError('useRestContext must be used inside RestContextProvider')
  }

  return context
}

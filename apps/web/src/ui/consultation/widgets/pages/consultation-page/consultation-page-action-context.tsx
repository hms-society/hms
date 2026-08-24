import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type ConsultationPagePrimaryAction = {
  onClick: () => void
  isPending: boolean
  isDisabled?: boolean
  disabledReason?: string
  label?: string
}

type ConsultationPageActionContextValue = {
  primaryAction: ConsultationPagePrimaryAction | null
  registerPrimaryAction: (action: ConsultationPagePrimaryAction | null) => void
}

function ignorePrimaryAction() {}

const DEFAULT_CONTEXT_VALUE: ConsultationPageActionContextValue = {
  primaryAction: null,
  registerPrimaryAction: ignorePrimaryAction,
}

const ConsultationPageActionContext =
  createContext<ConsultationPageActionContextValue>(DEFAULT_CONTEXT_VALUE)

export type ConsultationPageActionProviderProps = {
  children: ReactNode
}

export const ConsultationPageActionProvider = ({
  children,
}: ConsultationPageActionProviderProps) => {
  const [primaryAction, setPrimaryAction] =
    useState<ConsultationPagePrimaryAction | null>(null)
  const registerPrimaryAction = useCallback(function registerPrimaryAction(
    action: ConsultationPagePrimaryAction | null,
  ) {
    setPrimaryAction(action)
  }, [])

  return (
    <ConsultationPageActionContext.Provider
      value={{ primaryAction, registerPrimaryAction }}
    >
      {children}
    </ConsultationPageActionContext.Provider>
  )
}

export function useConsultationPageAction() {
  return useContext(ConsultationPageActionContext)
}

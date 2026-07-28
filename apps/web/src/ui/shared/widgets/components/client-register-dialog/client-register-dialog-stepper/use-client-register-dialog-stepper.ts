import type { ClientRegisterDialogState } from '../use-client-register-dialog'

export const STEPS = [
  { key: 'identification', label: 'Identificação' },
  { key: 'existing-client', label: 'Cliente' },
  { key: 'registration', label: 'Cadastro' },
  { key: 'privacy', label: 'Privacidade' },
  { key: 'review', label: 'Revisão' },
] as const

export const STEP_INDEX: Record<ClientRegisterDialogState, number> = {
  identification: 0,
  'existing-client': 1,
  'not-found': 1,
  registration: 2,
  privacy: 3,
  review: 4,
}

export function useClientRegisterDialogStepper(state: ClientRegisterDialogState) {
  const currentIndex = STEP_INDEX[state]
  const currentStep = STEPS[currentIndex]

  return {
    currentStep,
    currentStepNumber: currentIndex + 1,
    steps: STEPS.map(function getStepState(step, index) {
      return {
        ...step,
        isCurrent: index === currentIndex,
        isCompleted: index < currentIndex,
      }
    }),
    stepsCount: STEPS.length,
  }
}

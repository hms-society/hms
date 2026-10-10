import { useReducer } from 'react'

import type { PendingMutation } from './case-team-mutation-types'

type MutationDialogState = {
  pendingMutation: PendingMutation | null
  reason: string
  operationId: string | null
  hasVersionConflict: boolean
  mutationError: string | null
  isSelectorOpen: boolean
}

type MutationDialogAction =
  | { type: 'reset' }
  | { type: 'begin'; mutation: PendingMutation }
  | { type: 'reason'; value: string }
  | { type: 'operation'; value: string | null }
  | { type: 'conflict'; value: boolean }
  | { type: 'error'; value: string | null }
  | { type: 'selector'; value: boolean }

const INITIAL_STATE: MutationDialogState = {
  pendingMutation: null,
  reason: '',
  operationId: null,
  hasVersionConflict: false,
  mutationError: null,
  isSelectorOpen: false,
}

type MutationDialogTransitions = {
  [Type in MutationDialogAction['type']]: (
    state: MutationDialogState,
    action: Extract<MutationDialogAction, { type: Type }>,
  ) => MutationDialogState
}

const MUTATION_DIALOG_TRANSITIONS: MutationDialogTransitions = {
  reset(state) {
    return { ...INITIAL_STATE, isSelectorOpen: state.isSelectorOpen }
  },
  begin(state, action) {
    return {
      ...state,
      pendingMutation: action.mutation,
      reason: '',
      operationId: null,
      hasVersionConflict: false,
      mutationError: null,
    }
  },
  reason(state, action) {
    return { ...state, reason: action.value }
  },
  operation(state, action) {
    return { ...state, operationId: action.value }
  },
  conflict(state, action) {
    return { ...state, hasVersionConflict: action.value }
  },
  error(state, action) {
    return { ...state, mutationError: action.value }
  },
  selector(state, action) {
    return { ...state, isSelectorOpen: action.value }
  },
}

function mutationDialogReducer(
  state: MutationDialogState,
  action: MutationDialogAction,
): MutationDialogState {
  return MUTATION_DIALOG_TRANSITIONS[action.type](state, action as never)
}

type MutationDialogDispatch = (action: MutationDialogAction) => void

function createDialogLifecycleActions(dispatch: MutationDialogDispatch) {
  return {
    resetMutationState() {
      dispatch({ type: 'reset' })
    },
    beginMutation(mutation: PendingMutation) {
      dispatch({ type: 'begin', mutation })
    },
  }
}

function createMutationInputActions(dispatch: MutationDialogDispatch) {
  return {
    setReason(reason: string) {
      dispatch({ type: 'reason', value: reason })
    },
    setOperationId(operationId: string | null) {
      dispatch({ type: 'operation', value: operationId })
    },
  }
}

function createMutationStatusActions(dispatch: MutationDialogDispatch) {
  return {
    setHasVersionConflict(hasVersionConflict: boolean) {
      dispatch({ type: 'conflict', value: hasVersionConflict })
    },
    setMutationError(mutationError: string | null) {
      dispatch({ type: 'error', value: mutationError })
    },
    setIsSelectorOpen(isSelectorOpen: boolean) {
      dispatch({ type: 'selector', value: isSelectorOpen })
    },
  }
}

function createMutationStateActions(dispatch: MutationDialogDispatch) {
  return {
    ...createDialogLifecycleActions(dispatch),
    ...createMutationInputActions(dispatch),
    ...createMutationStatusActions(dispatch),
  }
}

export function useCaseTeamMutationState() {
  const [state, dispatch] = useReducer(mutationDialogReducer, INITIAL_STATE)
  return { ...state, ...createMutationStateActions(dispatch) }
}

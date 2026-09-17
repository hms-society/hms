import type { DynamicFormSaveBarProps } from './types'
export function useDynamicFormSaveBar(props: DynamicFormSaveBarProps) {
  return {
    ...props,
    canSave: props.state.kind === 'dirty' && props.state.isValid,
    isSaving: props.state.kind === 'saving',
    message:
      props.state.kind === 'failure'
        ? props.state.message
        : props.state.kind === 'saving'
          ? 'Salvando alterações…'
          : props.state.kind === 'dirty'
            ? 'Alterações não salvas'
            : 'Alterações salvas agora',
  }
}

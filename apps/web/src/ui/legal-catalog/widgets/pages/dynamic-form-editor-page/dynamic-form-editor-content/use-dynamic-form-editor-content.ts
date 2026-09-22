import type { DynamicFormEditorContentProps } from './types'

export function useDynamicFormEditorContent({
  props,
  editor,
}: DynamicFormEditorContentProps) {
  const { draft } = editor
  const form = editor.detailQuery.data?.form ?? null
  const title =
    props.mode === 'create' ? 'Novo formulário' : (form?.name ?? 'Editar formulário')
  const canDelete = props.mode === 'edit' && Boolean(form)

  function openFieldByClientId(clientId: string) {
    const index = draft.fields.findIndex((field) => field.clientId === clientId)
    editor.openField(index < 0 ? 'create' : 'edit', index < 0 ? undefined : index)
  }

  return {
    editor,
    draft,
    title,
    canDelete,
    validationMessage: getValidationMessage(draft),
    openFieldByClientId,
  }
}

function getValidationMessage(draft: DynamicFormEditorContentProps['editor']['draft']) {
  if (
    draft.name.trim() &&
    draft.legalAreaId &&
    draft.legalTopicIds.length &&
    draft.fields.length
  )
    return null
  return 'Preencha nome, área, pelo menos um tema e um campo para salvar.'
}

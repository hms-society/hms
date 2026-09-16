import type { DynamicFormStage } from '@hms/core/legal-catalog/domain/structures'
import type {
  CreateDynamicFormInput,
  UpdateDynamicFormInput,
} from '@hms/validation/legal-catalog'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  useChangeDynamicFormAvailabilityAction,
  useCreateDynamicFormAction,
  useDeleteDynamicFormAction,
  useDynamicFormForAdministrationQuery,
  useLegalAreasForAdministrationQuery,
  useLegalTopicsForAdministrationQuery,
  useUpdateDynamicFormAction,
} from '@/ui/legal-catalog/hooks'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import {
  hydrateField,
  makeClientId,
  toDefinitionRequest,
  type DynamicFormEditorField,
  type DynamicFormEditorOverlayState,
  type DynamicFormEditorPageProps,
  type DynamicFormEditorSaveState,
} from './types'

type Draft = {
  name: string
  description: string
  stage: DynamicFormStage
  legalAreaId: string
  legalTopicIds: string[]
  fields: DynamicFormEditorField[]
}

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  stage: 'consultation',
  legalAreaId: '',
  legalTopicIds: [],
  fields: [],
}

export function useDynamicFormEditorPage(props: DynamicFormEditorPageProps) {
  const { navigateTo } = useNavigation()
  const detailQuery = useDynamicFormForAdministrationQuery(
    props.mode === 'edit' && props.isValidId !== false ? props.dynamicFormId : undefined,
  )
  const areasQuery = useLegalAreasForAdministrationQuery()
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [baseline, setBaseline] = useState<Draft>(EMPTY_DRAFT)
  const [version, setVersion] = useState(1)
  const [overlay, setOverlay] = useState<DynamicFormEditorOverlayState>({
    kind: 'closed',
  })
  const [saveState, setSaveState] = useState<DynamicFormEditorSaveState>({
    kind: 'saved',
  })
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [bypassBlocker, setBypassBlocker] = useState(false)
  const operationKey = useRef<string | null>(null)
  const failedOperationKey = useRef<string | null>(null)
  const createAction = useCreateDynamicFormAction()
  const updateAction = useUpdateDynamicFormAction()
  const deleteAction = useDeleteDynamicFormAction()
  const availabilityAction = useChangeDynamicFormAvailabilityAction()

  const topicsQuery = useLegalTopicsForAdministrationQuery(draft.legalAreaId || undefined)
  const selectedField =
    draft.fields.find((field) => field.clientId === selectedFieldId) ?? null
  useEffect(() => {
    if (props.mode !== 'edit' || !detailQuery.data) return
    const form = detailQuery.data.form
    const hydrated: Draft = {
      name: form.name,
      description: form.description ?? '',
      stage: form.stage,
      legalAreaId: form.legalAreaId,
      legalTopicIds: [...form.legalTopicIds],
      fields: form.fields.map(hydrateField),
    }
    setDraft(hydrated)
    setBaseline(hydrated)
    setVersion(form.version)
    setSaveState({ kind: 'saved' })
    operationKey.current = null
    failedOperationKey.current = null
  }, [detailQuery.data, props.mode])

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(baseline),
    [draft, baseline],
  )
  const isValid = Boolean(
    draft.name.trim() &&
      draft.legalAreaId &&
      draft.legalTopicIds.length > 0 &&
      draft.fields.length > 0,
  )
  const saveStateIsValid = saveState.kind === 'dirty' ? saveState.isValid : undefined

  useEffect(() => {
    if (isDirty && saveState.kind === 'saved') setSaveState({ kind: 'dirty', isValid })
    if (isDirty && saveState.kind === 'dirty' && saveStateIsValid !== isValid)
      setSaveState({ kind: 'dirty', isValid })
    if (!isDirty && saveState.kind === 'dirty') setSaveState({ kind: 'saved' })
  }, [isDirty, isValid, saveState.kind, saveStateIsValid])

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty || bypassBlocker) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [bypassBlocker, isDirty])

  const invalidateFailedOperation = useCallback(() => {
    if (failedOperationKey.current === null) return
    operationKey.current = null
    failedOperationKey.current = null
  }, [])

  const updateDraft = useCallback(
    <K extends keyof Draft>(key: K, value: Draft[K]) => {
      invalidateFailedOperation()
      setDraft((current) => ({ ...current, [key]: value }))
    },
    [invalidateFailedOperation],
  )

  function openField(mode: 'create' | 'edit', fieldIndex?: number) {
    setOverlay({ kind: 'field', mode, fieldIndex })
  }

  function saveField(field: DynamicFormEditorField) {
    invalidateFailedOperation()
    setDraft((current) => {
      const fields = [...current.fields]
      const index = overlay.kind === 'field' ? overlay.fieldIndex : undefined
      if (index === undefined) fields.push(field)
      else fields[index] = field
      return { ...current, fields }
    })
    setOverlay({ kind: 'closed' })
  }

  function removeField(fieldClientId: string) {
    invalidateFailedOperation()
    setDraft((current) => ({
      ...current,
      fields: current.fields.filter((field) => field.clientId !== fieldClientId),
    }))
    setSelectedFieldId(null)
    setOverlay({ kind: 'closed' })
  }

  function moveField(fieldClientId: string, targetIndex: number) {
    invalidateFailedOperation()
    setDraft((current) => {
      const fromIndex = current.fields.findIndex(
        (field) => field.clientId === fieldClientId,
      )
      if (fromIndex < 0 || targetIndex < 0 || targetIndex >= current.fields.length)
        return current
      const fields = [...current.fields]
      const [field] = fields.splice(fromIndex, 1)
      if (!field) return current
      fields.splice(targetIndex, 0, field)
      return { ...current, fields }
    })
  }

  function failureMessage(_error: unknown) {
    return 'Não foi possível salvar as alterações.'
  }

  async function submit() {
    if (!isValid || saveState.kind === 'saving') return
    const key = operationKey.current ?? makeClientId()
    operationKey.current = key
    const input = { ...toDefinitionRequest(draft), operationKey: key }
    setSaveState({ kind: 'saving' })
    setSaveError(null)
    try {
      const form =
        props.mode === 'create'
          ? await createAction.createDynamicForm(input as CreateDynamicFormInput)
          : await updateAction.updateDynamicForm(props.dynamicFormId, {
              ...input,
              expectedVersion: version,
            } as UpdateDynamicFormInput)
      const nextDraft = { ...draft, fields: draft.fields.map((field) => ({ ...field })) }
      setDraft(nextDraft)
      setBaseline(nextDraft)
      setVersion(form.version)
      setSaveState({ kind: 'saved' })
      operationKey.current = null
      failedOperationKey.current = null
      setBypassBlocker(true)
      if (props.mode === 'create') {
        await navigateTo('dynamicForm', {
          params: { dynamicFormId: form.id },
          replace: true,
        })
      }
    } catch (error) {
      const candidate = error as { statusCode?: number; failureBody?: unknown }
      const body = candidate.failureBody as
        | { code?: string; metadata?: { currentVersion?: number } }
        | undefined
      if (
        candidate.statusCode === 409 &&
        body?.code === 'DYNAMIC_FORM_VERSION_CONFLICT'
      ) {
        setOverlay({
          kind: 'stale-version',
          expectedVersion: version,
          currentVersion: body.metadata?.currentVersion ?? version,
        })
      }
      setSaveError(failureMessage(error))
      setSaveState({
        kind: 'failure',
        failedOperationKey: key,
        message: failureMessage(error),
      })
      failedOperationKey.current = key
    }
  }

  async function retrySave() {
    await submit()
  }

  async function reloadServerVersion() {
    if (props.mode !== 'edit') return
    const result = await detailQuery.refetch()
    if (!result.data) return
    const form = result.data.form
    const nextDraft: Draft = {
      name: form.name,
      description: form.description ?? '',
      stage: form.stage,
      legalAreaId: form.legalAreaId,
      legalTopicIds: [...form.legalTopicIds],
      fields: form.fields.map(hydrateField),
    }
    setDraft(nextDraft)
    setBaseline(nextDraft)
    setVersion(form.version)
    setOverlay({ kind: 'closed' })
    setSaveState({ kind: 'saved' })
    setSaveError(null)
  }

  async function deleteForm() {
    if (props.mode !== 'edit') return
    try {
      await deleteAction.deleteDynamicForm(props.dynamicFormId)
      setBypassBlocker(true)
      await navigateTo('dynamicForms')
    } catch {
      // Keep the dialog open so the operator can recover from the failure.
    }
  }

  async function toggleAvailability() {
    if (props.mode !== 'edit' || isDirty || !detailQuery.data) return
    const next =
      detailQuery.data.form.status === 'available' ? 'unavailable' : 'available'
    try {
      await availabilityAction.changeDynamicFormAvailability(props.dynamicFormId, {
        status: next,
      })
      await detailQuery.refetch()
    } catch {
      // The action error is rendered next to the availability control.
    }
  }

  const isLoading = props.mode === 'edit' && detailQuery.isPending
  const isNotFound =
    props.mode === 'edit' &&
    detailQuery.isError &&
    (detailQuery.error as { statusCode?: number } | null)?.statusCode === 404
  const areaName =
    areasQuery.data?.find((area) => area.id === draft.legalAreaId)?.name ?? ''
  const topicNames =
    topicsQuery.data
      ?.filter((topic) => draft.legalTopicIds.includes(topic.id))
      .map((topic) => topic.name) ?? []

  return {
    props,
    draft,
    updateDraft,
    areasQuery,
    topicsQuery,
    detailQuery,
    areaName,
    topicNames,
    version,
    isDirty,
    isValid,
    isLoading,
    isNotFound,
    overlay,
    saveState,
    saveError,
    selectedField,
    navigateTo,
    openField,
    saveField,
    openRemoveField: (fieldClientId: string) => {
      setSelectedFieldId(fieldClientId)
      setOverlay({ kind: 'remove-field', fieldClientId })
    },
    removeField,
    moveField,
    closeOverlay: () => setOverlay({ kind: 'closed' }),
    openDelete: () => setOverlay({ kind: 'delete-form' }),
    openUnsavedNavigation: () => setOverlay({ kind: 'unsaved-navigation' }),
    openStale: () =>
      setOverlay({
        kind: 'stale-version',
        expectedVersion: version,
        currentVersion: version,
      }),
    submit,
    retrySave,
    reloadServerVersion,
    deleteForm,
    toggleAvailability,
    bypassBlocker,
    setBypassBlocker,
    setOverlay,
    availabilityPending: availabilityAction.isPending,
    availabilityError: availabilityAction.error
      ? 'Não foi possível alterar a disponibilidade.'
      : null,
    deletePending: deleteAction.isPending,
    deleteError: deleteAction.error ? 'Não foi possível excluir o formulário.' : null,
  }
}

export type DynamicFormEditorPageController = ReturnType<typeof useDynamicFormEditorPage>

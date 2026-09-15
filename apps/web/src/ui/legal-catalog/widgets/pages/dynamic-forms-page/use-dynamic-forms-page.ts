import type {
  DynamicFormListItem,
  DynamicFormListQuery,
  DynamicFormStatus,
} from '@hms/core/legal-catalog/domain/structures'
import type { DuplicateDynamicFormInput } from '@hms/validation/legal-catalog'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  useChangeDynamicFormAvailabilityAction,
  useDeleteDynamicFormAction,
  useDuplicateDynamicFormAction,
  useDynamicFormUsageImpactQuery,
  useDynamicFormsAdministrationQuery,
} from '@/ui/legal-catalog/hooks'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type DynamicFormOverlayState =
  | { kind: 'closed' }
  | { kind: 'duplicate' | 'availability' | 'delete'; form: DynamicFormListItem }

const SEARCH_PARAMS = {
  search: parseAsString.withDefault(''),
  stage: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(5),
}

function toStatus(value: string): DynamicFormStatus | undefined {
  return value === 'available' || value === 'unavailable' ? value : undefined
}

export function useDynamicFormsPage() {
  const [searchParams, setSearchParams] = useQueryStates(SEARCH_PARAMS, {
    history: 'push',
  })
  const { navigateTo } = useNavigation()
  const [overlay, setOverlay] = useState<DynamicFormOverlayState>({ kind: 'closed' })
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const duplicateOperationKey = useRef<string | null>(null)

  const query = useMemo<DynamicFormListQuery>(
    () => ({
      search: searchParams.search.trim() || undefined,
      stage:
        searchParams.stage === 'consultation' || searchParams.stage === 'formalization'
          ? searchParams.stage
          : undefined,
      status: toStatus(searchParams.status),
      page: Math.max(searchParams.page, 1),
      pageSize: 5,
    }),
    [searchParams],
  )

  const formsQuery = useDynamicFormsAdministrationQuery(query)
  const impactQuery = useDynamicFormUsageImpactQuery(
    overlay.kind === 'closed' || overlay.kind === 'duplicate'
      ? undefined
      : overlay.form.id,
    overlay.kind === 'availability' || overlay.kind === 'delete',
  )
  const duplicateAction = useDuplicateDynamicFormAction()
  const availabilityAction = useChangeDynamicFormAvailabilityAction()
  const deleteAction = useDeleteDynamicFormAction()

  useEffect(() => {
    if (formsQuery.data && formsQuery.data.page !== searchParams.page) {
      void setSearchParams({ page: formsQuery.data.page })
    }
  }, [formsQuery.data, searchParams.page, setSearchParams])

  function updateSearch(patch: {
    search?: string
    stage?: string
    status?: string
    page?: number
  }) {
    const filterChanged = Object.keys(patch).some((key) => key !== 'page')
    return setSearchParams({ ...patch, ...(filterChanged ? { page: 1 } : {}) })
  }

  function clearFilters() {
    return setSearchParams({ search: '', stage: '', status: '', page: 1 })
  }

  function openDuplicate(form: DynamicFormListItem) {
    duplicateOperationKey.current = crypto.randomUUID()
    setDuplicateError(null)
    setSuccessMessage(null)
    setOverlay({ kind: 'duplicate', form })
  }

  function openAvailability(form: DynamicFormListItem) {
    setAvailabilityError(null)
    setSuccessMessage(null)
    setOverlay({ kind: 'availability', form })
  }

  function openDelete(form: DynamicFormListItem) {
    setDeleteError(null)
    setSuccessMessage(null)
    setOverlay({ kind: 'delete', form })
  }

  function closeOverlay() {
    if (
      duplicateAction.isPending ||
      availabilityAction.isPending ||
      deleteAction.isPending
    )
      return
    const formName = overlay.kind === 'closed' ? null : overlay.form.name
    duplicateOperationKey.current = null
    setOverlay({ kind: 'closed' })
    if (formName) {
      window.setTimeout(() => {
        const trigger = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
          (button) => button.getAttribute('aria-label') === `Ações de ${formName}`,
        )
        trigger?.focus()
      }, 0)
    }
  }

  async function handleDuplicate(input: DuplicateDynamicFormInput) {
    if (overlay.kind !== 'duplicate' || !duplicateOperationKey.current) return
    try {
      await duplicateAction.duplicateDynamicForm(overlay.form.id, {
        ...input,
        operationKey: duplicateOperationKey.current,
      })
      duplicateOperationKey.current = null
      setSuccessMessage('Formulário duplicado com sucesso.')
      closeOverlay()
    } catch (error) {
      setDuplicateError(
        error instanceof Error
          ? error.message
          : 'Não foi possível duplicar o formulário.',
      )
    }
  }

  async function handleAvailability() {
    if (overlay.kind !== 'availability') return
    const status = overlay.form.status === 'available' ? 'unavailable' : 'available'
    try {
      await availabilityAction.changeDynamicFormAvailability(overlay.form.id, { status })
      setSuccessMessage('Disponibilidade atualizada com sucesso.')
      closeOverlay()
    } catch (error) {
      setAvailabilityError(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar a disponibilidade.',
      )
    }
  }

  async function handleDelete() {
    if (overlay.kind !== 'delete') return
    try {
      await deleteAction.deleteDynamicForm(overlay.form.id)
      setSuccessMessage('Formulário excluído com sucesso.')
      closeOverlay()
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Não foi possível excluir o formulário.',
      )
    }
  }

  function retryImpact() {
    return impactQuery.refetch()
  }

  function handleEdit(dynamicFormId: string) {
    void navigateTo('dynamicForm', { params: { dynamicFormId } })
  }

  function handleOpenNew() {
    void navigateTo('newDynamicForm')
  }

  const data = formsQuery.data
  const hasFilters = Boolean(
    searchParams.search || searchParams.stage || searchParams.status,
  )

  return {
    data,
    formsQuery,
    searchParams,
    hasFilters,
    overlay,
    impact: impactQuery.data ?? null,
    isImpactPending: impactQuery.isPending || impactQuery.isFetching,
    isImpactError: impactQuery.isError,
    retryImpact,
    duplicateError,
    duplicateConflict: duplicateAction.conflict,
    availabilityError,
    deleteError,
    successMessage,
    duplicateAction,
    availabilityAction,
    deleteAction,
    updateSearch,
    clearFilters,
    openDuplicate,
    openAvailability,
    openDelete,
    closeOverlay,
    handleDuplicate,
    handleAvailability,
    handleDelete,
    handleEdit,
    handleOpenNew,
  }
}

export type DynamicFormsPageController = ReturnType<typeof useDynamicFormsPage>

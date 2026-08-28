import { useEffect, useState } from 'react'

import type { DynamicForm } from '@hms/core/shared/domain'

import {
  useDynamicFormOptionsQuery,
  type LegalAreaOption,
  type LegalTopicOption,
} from '@/ui/shared/hooks/use-dynamic-form-options-query'

export type FormOption = {
  id: string
  title: string
  area?: string
  theme?: string
  legalAreaId?: string
  legalTopicIds: string[]
  fields: DynamicForm['fields']
}

export type UseSelectFormOptions = {
  isOpen: boolean
  initialLegalAreaId?: string
  initialLegalTopicId?: string
  initialSelectedFormId?: string
  contextType?: string
}

export function useSelectForm({
  isOpen,
  initialLegalAreaId,
  initialLegalTopicId,
  initialSelectedFormId,
  contextType,
}: UseSelectFormOptions) {
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState(initialLegalAreaId ?? '')
  const [selectedTheme, setSelectedTheme] = useState(initialLegalTopicId ?? '')
  const [selectedId, setSelectedId] = useState('')

  useEffect(
    function syncInitialContextWhenOpening() {
      if (!isOpen) return

      setSearch('')
      setSelectedArea(initialLegalAreaId ?? '')
      setSelectedTheme(initialLegalTopicId ?? '')
      setSelectedId(initialSelectedFormId ?? '')
    },
    [isOpen, initialLegalAreaId, initialLegalTopicId, initialSelectedFormId],
  )

  const {
    dynamicForms,
    isDynamicFormsError: isFormsError,
    isLoadingDynamicForms: isFormsLoading,
    legalAreas: areas,
    legalTopics: topics,
  } = useDynamicFormOptionsQuery({
    contextType,
    enabled: isOpen,
    legalAreaId: selectedArea,
    legalTopicId: selectedTheme,
    search,
  })
  const forms = dynamicForms.map((form) => toFormOption(form, areas, topics, contextType))

  useEffect(
    function preserveSelectedFormForContext() {
      if (!isOpen || !forms.length) return

      setSelectedId((current) =>
        forms.some((form) => form.id === current)
          ? current
          : forms.some((form) => form.id === initialSelectedFormId)
            ? (initialSelectedFormId ?? '')
            : '',
      )
    },
    [isOpen, forms, initialSelectedFormId],
  )

  function handleAreaChange(areaId: string) {
    setSelectedArea(areaId)
    setSelectedTheme('')
    setSelectedId('')
  }

  function handleThemeChange(topicId: string) {
    setSelectedTheme(topicId)
    setSelectedId('')
  }

  function handleSelectForm(formId: string) {
    setSelectedId(formId)
  }

  function handleConfirm(onSelect: (form: FormOption) => void, onClose: () => void) {
    const selectedForm = forms.find((form) => form.id === selectedId)

    if (!selectedForm) return

    onSelect(selectedForm)
    onClose()
  }

  return {
    areas,
    forms,
    handleAreaChange,
    handleConfirm,
    handleSelectForm,
    handleThemeChange,
    isFormsError,
    isFormsLoading,
    search,
    selectedArea,
    selectedId,
    selectedTheme,
    setSearch,
    topics,
  }
}

function toFormOption(
  form: DynamicForm,
  areas: readonly LegalAreaOption[],
  topics: readonly LegalTopicOption[],
  contextType?: string,
): FormOption {
  const legalContext = form.contexts.find(
    (context) => context.type === (contextType ?? 'legal'),
  )
  const legalAreaId = getStringValue(legalContext?.data.legalAreaId)
  const legalTopicIds = getStringArrayValue(legalContext?.data.legalTopicIds)
  const area = areas.find((item) => item.id === legalAreaId)?.name
  const themeNames = topics
    .filter((topic) => legalTopicIds.includes(topic.id))
    .map((topic) => topic.name)

  return {
    id: form.id,
    title: form.name,
    area,
    theme: themeNames.join(' · ') || undefined,
    legalAreaId,
    legalTopicIds,
    fields: form.fields,
  }
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getStringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

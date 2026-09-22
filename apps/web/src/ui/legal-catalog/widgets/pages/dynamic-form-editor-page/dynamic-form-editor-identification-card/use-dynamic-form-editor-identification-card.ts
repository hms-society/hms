import { useState, type KeyboardEvent } from 'react'

import type { DynamicFormEditorIdentificationCardProps } from './types'

export function useDynamicFormEditorIdentificationCard({
  props,
  editor,
}: DynamicFormEditorIdentificationCardProps) {
  const { draft } = editor
  const form = editor.detailQuery.data?.form
  const areas = editor.areasQuery.data ?? []
  const topics = editor.topicsQuery.data ?? []
  const selectedTopics = topics.filter((topic) => draft.legalTopicIds.includes(topic.id))
  const [topicsOpen, setTopicsOpen] = useState(false)
  const canToggleAvailability =
    props.mode === 'edit' && !editor.isDirty && !editor.availabilityPending

  function toggleTopic(topicId: string) {
    const nextTopicIds = draft.legalTopicIds.includes(topicId)
      ? draft.legalTopicIds.filter((id) => id !== topicId)
      : [...draft.legalTopicIds, topicId]
    editor.updateDraft('legalTopicIds', nextTopicIds)
  }

  function handleTopicsTriggerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return

    event.preventDefault()
    setTopicsOpen(true)
  }

  return {
    editor,
    draft,
    form,
    areas,
    topics,
    selectedTopics,
    topicsOpen,
    setTopicsOpen,
    canToggleAvailability,
    toggleTopic,
    handleTopicsTriggerKeyDown,
    isTopicsPending: editor.topicsQuery.isPending,
  }
}

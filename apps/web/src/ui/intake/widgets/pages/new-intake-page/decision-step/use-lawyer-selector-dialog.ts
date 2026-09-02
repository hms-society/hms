import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { useEffect, useMemo, useState } from 'react'

import { useIntakeLawyersQuery } from '@/ui/intake/hooks/use-intake-lawyers-query'

const AVATAR_CLASS_NAMES = [
  'bg-primary/15 text-primary',
  'bg-brand-highlight text-primary-foreground',
  'bg-chart-3 text-primary-foreground',
  'bg-chart-2 text-primary-foreground',
]

export type LawyerOption = {
  value: string
  label: string
  area: string
  topics: string[]
  initials: string
  avatarClassName: string
}

export type LawyerSelectorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLawyer?: string
  onSelect: (lawyer: LawyerOption) => void
}

export function useLawyerSelectorDialog({
  open,
  onOpenChange,
  selectedLawyer,
  onSelect,
}: LawyerSelectorDialogProps) {
  const [draftSelection, setDraftSelection] = useState(selectedLawyer ?? '')
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('all')
  const [topic, setTopic] = useState('all')

  const {
    hasNextPage,
    intakeLawyerPages,
    intakeLawyersError,
    isFetchingNextPage,
    isLoadingIntakeLawyers,
    fetchNextPage,
    refetchIntakeLawyers,
  } = useIntakeLawyersQuery(search, open)

  const lawyers = useMemo(
    () =>
      intakeLawyerPages.flatMap((page) =>
        page.items.map((collaborator, index) =>
          mapCollaboratorToLawyerOption(collaborator, index),
        ),
      ) ?? [],
    [intakeLawyerPages],
  )
  const areas = useMemo(
    () => [...new Set(lawyers.map((lawyer) => lawyer.area))].sort(),
    [lawyers],
  )
  const topics = useMemo(
    () => [...new Set(lawyers.flatMap((lawyer) => lawyer.topics))].sort(),
    [lawyers],
  )
  const filteredLawyers = useMemo(
    () =>
      lawyers.filter((lawyer) => {
        const matchesArea = area === 'all' || lawyer.area === area
        const matchesTopic = topic === 'all' || lawyer.topics.includes(topic)

        return matchesArea && matchesTopic
      }),
    [area, lawyers, topic],
  )
  const selectedLawyerOption = lawyers.find((lawyer) => lawyer.value === draftSelection)

  useEffect(
    function resetDraftWhenOpening() {
      if (!open) return
      setDraftSelection(selectedLawyer ?? '')
      setSearch('')
      setArea('all')
      setTopic('all')
    },
    [open, selectedLawyer],
  )

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleAreaChange(value: string) {
    setArea(value)
  }

  function handleTopicChange(value: string) {
    setTopic(value)
  }

  function handleLawyerSelect(value: string) {
    setDraftSelection(value)
  }

  function handleClearFilters() {
    setSearch('')
    setArea('all')
    setTopic('all')
  }

  function handleLoadMore() {
    if (hasNextPage && !isFetchingNextPage) {
      return fetchNextPage()
    }
  }

  function handleConfirm() {
    if (!selectedLawyerOption) return
    onSelect(selectedLawyerOption)
    onOpenChange(false)
  }

  function handleRetry() {
    return refetchIntakeLawyers()
  }

  return {
    area,
    areas,
    draftSelection,
    filteredLawyers,
    handleAreaChange,
    handleClearFilters,
    handleConfirm,
    handleLawyerSelect,
    handleLoadMore,
    handleRetry,
    handleSearchChange,
    handleTopicChange,
    isError: Boolean(intakeLawyersError),
    isFetchingNextPage,
    isLoading: isLoadingIntakeLawyers,
    hasNextPage,
    search,
    selectedLawyerOption,
    topic,
    topics,
  }
}

function mapCollaboratorToLawyerOption(
  collaborator: CollaboratorSummary,
  index: number,
): LawyerOption {
  const legalExpertises =
    'legalExpertises' in collaborator ? (collaborator.legalExpertises ?? []) : []
  const names = collaborator.professionalName.trim().split(/\s+/)
  const initials = [names[0], names.at(-1)]
    .filter(Boolean)
    .map((name) => name?.[0]?.toUpperCase())
    .join('')

  return {
    value: collaborator.collaboratorId,
    label: collaborator.professionalName,
    area: legalExpertises[0]?.legalArea.name ?? 'Área jurídica não informada',
    topics: [
      ...new Set(
        legalExpertises.flatMap((expertise) =>
          expertise.legalTopics.map((legalTopic) => legalTopic.name),
        ),
      ),
    ],
    initials: initials || 'AD',
    avatarClassName: AVATAR_CLASS_NAMES[index % AVATAR_CLASS_NAMES.length],
  }
}

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  LegalAreaWithTopics,
  LegalTopic,
} from '@hms/core/legal-catalog/domain/entities'
import {
  legalAreaInputSchema,
  legalTopicInputSchema,
} from '@hms/validation/legal-catalog'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { LegalCatalogDialogState } from './types'

const LEGAL_CATALOG_ADMIN_QUERY_KEY = ['legal-catalog', 'admin', 'areas'] as const

export function useLegalCatalogAdminPage() {
  const { legalCatalogService } = useRestContext()
  const queryClient = useQueryClient()
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [search, setSearch] = useState('')
  const [dialogState, setDialogState] = useState<LegalCatalogDialogState>()
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)
  const [feedback, setFeedback] = useState<string>()

  const {
    data: legalAreas = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: LEGAL_CATALOG_ADMIN_QUERY_KEY,
    queryFn: async function fetchLegalAreas() {
      const response = await legalCatalogService.listAdminLegalAreas()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  useEffect(
    function selectFirstArea() {
      if (selectedAreaId || legalAreas.length === 0) return

      setSelectedAreaId(legalAreas[0].id)
    },
    [legalAreas, selectedAreaId],
  )

  const selectedArea = legalAreas.find((area) => area.id === selectedAreaId)

  const filteredTopics = useMemo(() => {
    const topics = selectedArea?.topics ?? []
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) return topics

    return topics.filter((topic) => topic.name.toLowerCase().includes(normalizedSearch))
  }, [search, selectedArea])

  const saveMutation = useMutation({
    mutationFn: async function saveCatalogItem() {
      if (!dialogState) return undefined

      if (dialogState.kind === 'area') {
        const request = legalAreaInputSchema.parse({ name, active })
        const response = dialogState.area
          ? await legalCatalogService.updateLegalArea(dialogState.area.id, request)
          : await legalCatalogService.createLegalArea(request)

        if (response.isFailure) response.throwError()

        return response.body
      }

      if (!selectedArea) return undefined

      const request = legalTopicInputSchema.parse({
        legalAreaId: selectedArea.id,
        name,
        active,
      })
      const response = dialogState.topic
        ? await legalCatalogService.updateLegalTopic(dialogState.topic.id, {
            name: request.name,
            active: request.active,
          })
        : await legalCatalogService.createLegalTopic(request)

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async function handleSaved() {
      setFeedback('Configuração salva.')
      closeDialog()
      await queryClient.invalidateQueries({ queryKey: LEGAL_CATALOG_ADMIN_QUERY_KEY })
    },
  })

  const toggleAreaMutation = useMutation({
    mutationFn: async function toggleArea(area: LegalAreaWithTopics) {
      const response = await legalCatalogService.updateLegalArea(area.id, {
        active: !area.active,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async function handleAreaToggled() {
      await queryClient.invalidateQueries({ queryKey: LEGAL_CATALOG_ADMIN_QUERY_KEY })
    },
  })

  const toggleTopicMutation = useMutation({
    mutationFn: async function toggleTopic(topic: LegalTopic) {
      const response = await legalCatalogService.updateLegalTopic(topic.id, {
        active: !topic.active,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async function handleTopicToggled() {
      await queryClient.invalidateQueries({ queryKey: LEGAL_CATALOG_ADMIN_QUERY_KEY })
    },
  })

  function openNewAreaDialog() {
    setDialogState({ kind: 'area' })
    setName('')
    setActive(true)
  }

  function openEditAreaDialog(area: LegalAreaWithTopics) {
    setDialogState({ kind: 'area', area })
    setName(area.name)
    setActive(area.active)
  }

  function openNewTopicDialog() {
    setDialogState({ kind: 'topic' })
    setName('')
    setActive(true)
  }

  function openEditTopicDialog(topic: LegalTopic) {
    setDialogState({ kind: 'topic', topic })
    setName(topic.name)
    setActive(topic.active)
  }

  function closeDialog() {
    setDialogState(undefined)
    setName('')
    setActive(true)
  }

  async function handleSaveDialog() {
    await saveMutation.mutateAsync()
  }

  function handleToggleArea(area: LegalAreaWithTopics) {
    toggleAreaMutation.mutate(area)
  }

  function handleToggleTopic(topic: LegalTopic) {
    toggleTopicMutation.mutate(topic)
  }

  return {
    active,
    dialogState,
    error:
      error ??
      saveMutation.error ??
      toggleAreaMutation.error ??
      toggleTopicMutation.error,
    feedback,
    filteredTopics,
    isDialogOpen: Boolean(dialogState),
    isLoading,
    isSaving: saveMutation.isPending,
    legalAreas,
    name,
    search,
    selectedArea,
    selectedAreaId,
    setActive,
    setName,
    setSearch,
    setSelectedAreaId,
    closeDialog,
    handleSaveDialog,
    handleToggleArea,
    handleToggleTopic,
    openEditAreaDialog,
    openEditTopicDialog,
    openNewAreaDialog,
    openNewTopicDialog,
  }
}

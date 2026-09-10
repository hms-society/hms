import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'
import type { ChecklistDocument, DocumentFileType, LegalArea } from './types'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const CHECKLIST_TEMPLATES_QUERY_KEY = ['case-management', 'checklist-templates'] as const
const LEGAL_AREAS_QUERY_KEY = ['legal-catalog', 'areas'] as const

export function useChecklistsTemplates() {
  const { caseManagementService, legalCatalogService } = useRestContext()
  const queryClient = useQueryClient()
  const [activeAreaId, setActiveAreaId] = useState('')
  const [documentsByArea, setDocumentsByArea] = useState<
    Record<string, ChecklistDocument[]>
  >({})
  const [search, setSearch] = useState('')
  const [saveMessage, setSaveMessage] = useState<string>()

  const {
    data: legalAreas = [],
    error: legalAreasError,
    isLoading: isLoadingLegalAreas,
  } = useQuery({
    queryKey: LEGAL_AREAS_QUERY_KEY,
    queryFn: async function fetchLegalAreas() {
      const response = await legalCatalogService.listLegalAreas()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  const {
    data: checklistTemplates = [],
    error: checklistTemplatesError,
    isLoading: isLoadingChecklistTemplates,
  } = useQuery({
    queryKey: CHECKLIST_TEMPLATES_QUERY_KEY,
    queryFn: async function fetchChecklistTemplates() {
      const response = await caseManagementService.listChecklistTemplates()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  const replaceChecklistTemplateMutation = useMutation({
    mutationFn: async function replaceChecklistTemplate() {
      const activeArea = areas.find((area) => area.id === activeAreaId)
      const areaDocuments = documentsByArea[activeAreaId] ?? []

      if (!activeArea) return undefined

      const response = await caseManagementService.replaceChecklistTemplate({
        checklistTemplateId: activeArea.templateId,
        legalAreaId: activeArea.id,
        name: activeArea.name,
        isActive: true,
        items: areaDocuments.map((document, index) => ({
          title: document.name,
          documentTypes: document.types,
          isRequired: document.required,
          position: index,
        })),
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async function handleChecklistTemplateSaved() {
      setSaveMessage('Template de checklist salvo.')
      await queryClient.invalidateQueries({ queryKey: CHECKLIST_TEMPLATES_QUERY_KEY })
    },
  })

  const areas = useMemo<LegalArea[]>(() => {
    return legalAreas.map((legalArea) => {
      const template = checklistTemplates.find(
        (checklistTemplate) => checklistTemplate.legalAreaId === legalArea.id,
      )

      return {
        id: legalArea.id,
        name: legalArea.name,
        documentCount: template?.items.length ?? 0,
        templateId: template?.id,
      }
    })
  }, [checklistTemplates, legalAreas])

  useEffect(
    function selectFirstLegalArea() {
      if (activeAreaId || areas.length === 0) return

      setActiveAreaId(areas[0].id)
    },
    [activeAreaId, areas],
  )

  useEffect(
    function hydrateDocumentsFromTemplates() {
      setDocumentsByArea((current) => {
        const nextDocumentsByArea = { ...current }

        for (const template of checklistTemplates) {
          nextDocumentsByArea[template.legalAreaId] = template.items.map((item) => ({
            id: item.id,
            name: item.title,
            types: normalizeDocumentFileTypes(item.documentTypes),
            required: item.isRequired,
          }))
        }

        return nextDocumentsByArea
      })
    },
    [checklistTemplates],
  )

  const activeArea = areas.find((area) => area.id === activeAreaId)

  const documents = useMemo(() => {
    const areaDocuments = documentsByArea[activeAreaId] ?? []

    if (!search.trim()) {
      return areaDocuments
    }

    const normalizedSearch = search.toLowerCase().trim()

    return areaDocuments.filter((document) =>
      document.name.toLowerCase().includes(normalizedSearch),
    )
  }, [activeAreaId, documentsByArea, search])

  function toggleRequired(documentId: string) {
    setDocumentsByArea((current) => ({
      ...current,
      [activeAreaId]: current[activeAreaId].map((document) =>
        document.id === documentId
          ? {
              ...document,
              required: !document.required,
            }
          : document,
      ),
    }))
  }

  function changeDocumentType(documentId: string, type: DocumentFileType) {
    setDocumentsByArea((current) => ({
      ...current,
      [activeAreaId]: current[activeAreaId].map((document) =>
        document.id === documentId
          ? {
              ...document,
              types: toggleDocumentType(document.types, type),
            }
          : document,
      ),
    }))
  }

  function removeDocument(documentId: string) {
    setDocumentsByArea((current) => ({
      ...current,
      [activeAreaId]: current[activeAreaId].filter(
        (document) => document.id !== documentId,
      ),
    }))
  }

  function addDocument(
    name: string,
    types: readonly DocumentFileType[],
    required: boolean,
  ) {
    const document: ChecklistDocument = {
      id: crypto.randomUUID(),
      name,
      types,
      required,
    }

    setDocumentsByArea((current) => ({
      ...current,
      [activeAreaId]: [...(current[activeAreaId] ?? []), document],
    }))
  }

  async function saveTemplate() {
    await replaceChecklistTemplateMutation.mutateAsync()
  }

  return {
    areas,
    activeArea,
    activeAreaId,
    documents,
    error:
      legalAreasError ??
      checklistTemplatesError ??
      replaceChecklistTemplateMutation.error,
    isLoading: isLoadingLegalAreas || isLoadingChecklistTemplates,
    isSaving: replaceChecklistTemplateMutation.isPending,
    saveMessage,
    search,
    setSearch,
    setActiveAreaId,
    toggleRequired,
    changeDocumentType,
    removeDocument,
    addDocument,
    saveTemplate,
  }
}

function normalizeDocumentFileTypes(
  documentTypes: readonly string[],
): readonly DocumentFileType[] {
  const allowedDocumentTypes = documentTypes.filter(isDocumentFileType)

  if (
    allowedDocumentTypes.length === 0 ||
    allowedDocumentTypes.includes(ChecklistDocumentType.Any)
  ) {
    return [ChecklistDocumentType.Any]
  }

  return [...new Set(allowedDocumentTypes)]
}

function toggleDocumentType(
  currentTypes: readonly DocumentFileType[],
  type: DocumentFileType,
): readonly DocumentFileType[] {
  if (type === ChecklistDocumentType.Any) {
    return [ChecklistDocumentType.Any]
  }

  const withoutAny = currentTypes.filter(
    (currentType) => currentType !== ChecklistDocumentType.Any,
  )
  const nextTypes = withoutAny.includes(type)
    ? withoutAny.filter((currentType) => currentType !== type)
    : [...withoutAny, type]

  return nextTypes.length > 0 ? nextTypes : [ChecklistDocumentType.Any]
}

function isDocumentFileType(value: string): value is DocumentFileType {
  return Object.values(ChecklistDocumentType).includes(value as DocumentFileType)
}

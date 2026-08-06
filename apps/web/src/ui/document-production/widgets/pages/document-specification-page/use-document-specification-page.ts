import type {
  DocumentSpecificationApplication,
  DocumentSpecificationStatus,
  DocumentTemplateContent,
  DocumentTemplateVariable,
} from '@hms/core/document-production/domain/structures'
import { documentSpecificationConfigurationUpdateSchema } from '@hms/validation/document-production'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useBlocker } from '@tanstack/react-router'
import { toast } from 'sonner'

import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useDocumentCatalogQuery } from '../document-specifications-page/use-document-catalog-query'
import { useDocumentTopicsQuery } from '../document-specifications-page/use-document-topics-query'
import { useDocumentSpecificationActions } from './use-document-specification-actions'

export type DocumentSpecificationPageProps = {
  mode: 'create' | 'edit'
  documentSpecificationId?: string
}

type ConfigurationForm = {
  name: string
  description: string
  status: DocumentSpecificationStatus
  isRequired: boolean
  application: DocumentSpecificationApplication
}

type DocumentSpecificationQueryError = Error & { statusCode?: number }

export function isDocumentSpecificationNotFoundError(error: unknown) {
  return (
    error instanceof Error &&
    (error as DocumentSpecificationQueryError).statusCode === HTTP_STATUS_CODE.notFound
  )
}

export function shouldBlockLegalConfigurationSubmit(
  scope: DocumentSpecificationApplication['scope'],
  areasError: boolean,
  topicsError: boolean,
) {
  return scope === 'legal_context' && (areasError || topicsError)
}

const EMPTY_CONTENT: DocumentTemplateContent = {
  type: 'doc',
  content: [{ type: 'paragraph', attrs: { textAlign: null } }],
}

export function useDocumentSpecificationPage({
  mode,
  documentSpecificationId,
}: DocumentSpecificationPageProps) {
  const { documentProductionService } = useRestContext()
  const catalog = useDocumentCatalogQuery()
  const [activeTab, setActiveTab] = useState<'configuration' | 'template'>(
    'configuration',
  )
  const [content, setContent] = useState<DocumentTemplateContent>(EMPTY_CONTENT)
  const [variables, setVariables] = useState<readonly DocumentTemplateVariable[]>([])
  const [savedContent, setSavedContent] = useState(EMPTY_CONTENT)
  const [savedVariables, setSavedVariables] = useState<
    readonly DocumentTemplateVariable[]
  >([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [insertVariable, setInsertVariable] = useState<((name: string) => void) | null>(
    null,
  )
  const isNavigatingAfterSave = useRef(false)
  const { createDocumentSpecification, updateConfiguration, updateTemplate, ...actions } =
    useDocumentSpecificationActions()
  const form = useForm<ConfigurationForm>({
    resolver: zodResolver(documentSpecificationConfigurationUpdateSchema) as never,
    defaultValues: {
      name: '',
      description: '',
      status: 'unavailable',
      isRequired: false,
      application: { scope: 'global', moment: 'consultation' },
    },
  })
  const detail = useQuery({
    queryKey: ['document-specification', documentSpecificationId],
    enabled: mode === 'edit' && Boolean(documentSpecificationId),
    queryFn: async () => {
      const response = await documentProductionService.getDocumentSpecification(
        documentSpecificationId as string,
      )
      if (response.isFailure) {
        const error = new Error(response.errorMessage)
        Object.assign(error, { statusCode: response.statusCode })
        throw error
      }
      return response.body
    },
  })
  const application = form.watch('application')
  const topics = useDocumentTopicsQuery(
    application.scope === 'legal_context' ? application.legalAreaIds : null,
  )
  const isConfigurationDirty = form.formState.isDirty
  const isTemplateDirty =
    JSON.stringify(content) !== JSON.stringify(savedContent) ||
    JSON.stringify(variables) !== JSON.stringify(savedVariables)
  const isDirty = isConfigurationDirty || isTemplateDirty

  useBlocker({
    shouldBlockFn: () => {
      if (isNavigatingAfterSave.current) return false
      return !window.confirm('Existem alterações não salvas. Deseja sair mesmo assim?')
    },
    enableBeforeUnload: isDirty,
    disabled: !isDirty,
  })

  useEffect(
    function populateFormFromDetail() {
      const value = detail.data
      if (!value) return
      form.reset({
        name: value.name,
        description: value.description,
        status: value.status,
        isRequired: value.isRequired,
        application: value.application,
      })
      setContent(value.content)
      setSavedContent(value.content)
      setVariables(value.variables)
      setSavedVariables(value.variables)
    },
    [detail.data, form],
  )

  function handleRetry() {
    void detail.refetch()
  }

  function handleCatalogRetry() {
    void catalog.areas.refetch()
    void topics.refetch()
  }

  function handleContentChange(nextContent: DocumentTemplateContent) {
    setContent(nextContent)
    setSuccessMessage(null)
  }

  function handleAddVariable(variable: DocumentTemplateVariable) {
    setVariables(function addVariable(previous) {
      return [...previous, variable]
    })
    setSuccessMessage(null)
  }

  const handleEditorReady = useCallback((insert: (name: string) => void) => {
    setInsertVariable(() => insert)
  }, [])

  function handleApplicationScope(scope: 'global' | 'legal_context') {
    if (scope === 'global')
      form.setValue(
        'application',
        { scope, moment: application.moment },
        { shouldDirty: true },
      )
    else
      form.setValue(
        'application',
        { scope, moment: application.moment, legalAreaIds: [], legalTopicIdsByArea: {} },
        { shouldDirty: true },
      )
  }

  function handleAreaToggle(areaId: string) {
    if (application.scope !== 'legal_context') return
    const selected = application.legalAreaIds.includes(areaId)
    const legalAreaIds = selected
      ? application.legalAreaIds.filter((id) => id !== areaId)
      : [...application.legalAreaIds, areaId]
    const legalTopicIdsByArea = { ...application.legalTopicIdsByArea }
    if (selected) delete legalTopicIdsByArea[areaId]
    form.setValue(
      'application',
      { ...application, legalAreaIds, legalTopicIdsByArea },
      { shouldDirty: true },
    )
  }

  function handleTopicToggle(areaId: string, topicId: string) {
    if (application.scope !== 'legal_context') return
    const current = application.legalTopicIdsByArea[areaId] ?? []
    form.setValue(
      'application',
      {
        ...application,
        legalTopicIdsByArea: {
          ...application.legalTopicIdsByArea,
          [areaId]: current.includes(topicId)
            ? current.filter((id) => id !== topicId)
            : [...current, topicId],
        },
      },
      { shouldDirty: true },
    )
  }

  async function handleConfigurationSubmit(values: ConfigurationForm) {
    setErrorMessage(null)
    setSuccessMessage(null)
    if (
      shouldBlockLegalConfigurationSubmit(
        values.application.scope,
        catalog.areas.isError,
        topics.isError,
      )
    ) {
      const message =
        'Não foi possível carregar o Catálogo Jurídico. Tente novamente antes de salvar a aplicação jurídica.'
      setErrorMessage(message)
      return
    }
    if (values.status === 'available' && isTemplateEmpty) {
      const message =
        'Escreva e salve um template válido antes de disponibilizar o modelo.'
      form.setError('status', { type: 'validate', message })
      setErrorMessage(message)
      return
    }
    if (mode === 'create') {
      const response = await createDocumentSpecification({
        name: values.name,
        description: values.description,
        isRequired: values.isRequired,
        application: values.application,
      })
      if (response.isFailure) {
        setErrorMessage(response.errorMessage)
        return
      }
      isNavigatingAfterSave.current = true
      window.location.replace(
        `/modelos-de-documentos/${response.body.documentSpecificationId}`,
      )
      return
    }
    const response = await updateConfiguration({
      id: documentSpecificationId as string,
      request: values,
    })
    if (response.isFailure) {
      setErrorMessage(response.errorMessage)
      return
    }
    form.reset(values)
    const message = 'Configuração salva com sucesso.'
    setSuccessMessage(message)
    toast.success(message)
  }

  async function handleTemplateSave() {
    if (!documentSpecificationId || !isTemplateDirty) return
    setErrorMessage(null)
    const response = await updateTemplate({
      id: documentSpecificationId,
      request: { content, variables },
    })
    if (response.isFailure) {
      setErrorMessage(response.errorMessage)
      return
    }
    setSavedContent(content)
    setSavedVariables(variables)
    const message = 'Template salvo com sucesso.'
    setSuccessMessage(message)
    toast.success(message)
  }

  function handleTabChange(tab: string) {
    if (tab === 'template' && mode === 'create') return
    if (
      isDirty &&
      !window.confirm('Existem alterações não salvas. Deseja sair mesmo assim?')
    )
      return
    setActiveTab(tab as 'configuration' | 'template')
  }

  const isLoading = mode === 'edit' && detail.isLoading
  const isNotFound = mode === 'edit' && isDocumentSpecificationNotFoundError(detail.error)
  const variablesWithSystem = useMemo(() => variables, [variables])
  const isTemplateEmpty =
    !Object.values(content).join(' ').match(/\S/) ||
    !JSON.stringify(content).match(/"text":"\S/)
  const wordCount =
    JSON.stringify(content)
      .match(/"text":"([^"]*)"/g)
      ?.map((value) => value.slice(8, -1))
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length ?? 0
  return {
    activeTab,
    actions,
    application,
    catalog,
    content,
    detail,
    errorMessage,
    successMessage,
    form,
    handleAddVariable,
    handleApplicationScope,
    handleAreaToggle,
    handleConfigurationSubmit,
    handleContentChange,
    handleEditorReady,
    handleRetry,
    handleCatalogRetry,
    handleTabChange,
    handleTemplateSave,
    handleTopicToggle,
    isConfigurationDirty,
    isDirty,
    isLoading,
    insertVariable,
    isNotFound,
    isCatalogError: shouldBlockLegalConfigurationSubmit(
      application.scope,
      catalog.areas.isError,
      topics.isError,
    ),
    isTemplateDirty,
    isTemplateEmpty,
    wordCount,
    mode,
    setInsertVariable,
    topics,
    variables: variablesWithSystem,
  }
}

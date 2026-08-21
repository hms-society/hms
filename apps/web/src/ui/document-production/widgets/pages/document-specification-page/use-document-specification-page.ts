import type {
  DocumentSpecificationApplication,
  DocumentSpecificationStatus,
  DocumentTemplateContent,
  DocumentTemplateVariable,
} from '@hms/core/document-production/domain/structures'
import { SYSTEM_DOCUMENT_TEMPLATE_VARIABLES } from '@hms/core/document-production/domain/structures'
import { documentSpecificationConfigurationUpdateSchema } from '@hms/validation/document-production'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useBlocker } from '@tanstack/react-router'
import { toast } from 'sonner'

import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
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
  application: DocumentSpecificationApplication
  accessClassification: string
}

const DEFAULT_CONFIGURATION: ConfigurationForm = {
  name: '',
  description: '',
  status: 'available',
  application: { scope: 'global', moment: 'consultation' },
  accessClassification: 'Interno',
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

function normalizeDocumentTemplateVariables(
  value: readonly DocumentTemplateVariable[],
): readonly DocumentTemplateVariable[] {
  return [
    ...SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.map((variable) => {
      const override =
        value.find((item) => item.systemTechnicalName === variable.technicalName) ??
        value.find((item) => item.technicalName === variable.technicalName)
      return {
        ...(override ?? variable),
        systemTechnicalName: override?.systemTechnicalName ?? variable.technicalName,
      }
    }),
    ...value.filter(
      (variable) =>
        !variable.systemTechnicalName &&
        !SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.some(
          (systemVariable) => systemVariable.technicalName === variable.technicalName,
        ),
    ),
  ]
}

const DEFAULT_TEMPLATE_VARIABLES = normalizeDocumentTemplateVariables([])

function getDocumentTemplateText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''

  const node = value as { text?: unknown; content?: unknown }
  const text = typeof node.text === 'string' ? node.text : ''
  const children = Array.isArray(node.content)
    ? node.content.map(getDocumentTemplateText).join(' ')
    : ''

  return [text, children].filter(Boolean).join(' ')
}

function normalizeDocumentTemplateContent(value: unknown): DocumentTemplateContent {
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return EMPTY_CONTENT

    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [{ type: 'text', text }],
        },
      ],
    } as unknown as DocumentTemplateContent
  }

  if (value && typeof value === 'object' && 'type' in value) {
    return value as DocumentTemplateContent
  }

  return EMPTY_CONTENT
}

function replaceTemplateVariableTokens(
  value: unknown,
  previousTechnicalName: string,
  nextTechnicalName: string,
): unknown {
  if (typeof value === 'string')
    return value.replaceAll(`{{${previousTechnicalName}}}`, `{{${nextTechnicalName}}}`)
  if (Array.isArray(value))
    return value.map((item) =>
      replaceTemplateVariableTokens(item, previousTechnicalName, nextTechnicalName),
    )
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceTemplateVariableTokens(item, previousTechnicalName, nextTechnicalName),
      ]),
    )
  return value
}

function removeTemplateVariableTokens(value: unknown, technicalName: string): unknown {
  if (typeof value === 'string') return value.replaceAll(`{{${technicalName}}}`, '')
  if (Array.isArray(value))
    return value.map((item) => removeTemplateVariableTokens(item, technicalName))
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        removeTemplateVariableTokens(item, technicalName),
      ]),
    )
  return value
}

export function useDocumentSpecificationPage({
  mode,
  documentSpecificationId,
}: DocumentSpecificationPageProps) {
  const { documentProductionService } = useRestContext()
  const { navigateTo } = useNavigation()
  const catalog = useDocumentCatalogQuery()
  const [activeTab, setActiveTab] = useState<'configuration' | 'template'>(
    'configuration',
  )
  const [content, setContent] = useState<DocumentTemplateContent>(EMPTY_CONTENT)
  const [variables, setVariables] = useState<readonly DocumentTemplateVariable[]>(
    DEFAULT_TEMPLATE_VARIABLES,
  )
  const [savedContent, setSavedContent] = useState(EMPTY_CONTENT)
  const [savedVariables, setSavedVariables] = useState<
    readonly DocumentTemplateVariable[]
  >(DEFAULT_TEMPLATE_VARIABLES)
  const [savedConfiguration, setSavedConfiguration] = useState<ConfigurationForm | null>(
    mode === 'create' ? DEFAULT_CONFIGURATION : null,
  )
  const [insertVariable, setInsertVariable] = useState<((name: string) => void) | null>(
    null,
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const isNavigatingAfterSave = useRef(false)
  const {
    createDocumentSpecification,
    deleteDocumentSpecification,
    updateConfiguration,
    ...actions
  } = useDocumentSpecificationActions()
  const form = useForm<ConfigurationForm>({
    resolver: zodResolver(documentSpecificationConfigurationUpdateSchema) as never,
    defaultValues: DEFAULT_CONFIGURATION,
  })
  const detail = useQuery({
    queryKey: ['document-specification', documentSpecificationId],
    enabled: mode === 'edit' && Boolean(documentSpecificationId) && !isDeleted,
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
  const watchedConfiguration = form.watch()
  const application = watchedConfiguration.application
  const topics = useDocumentTopicsQuery(
    application.scope === 'legal_context' ? application.legalAreaIds : null,
  )
  const isConfigurationDirty =
    savedConfiguration !== null &&
    JSON.stringify(watchedConfiguration) !== JSON.stringify(savedConfiguration)
  const isTemplateDirty =
    JSON.stringify(content) !== JSON.stringify(savedContent) ||
    JSON.stringify(variables) !== JSON.stringify(savedVariables)
  const isDirty = isConfigurationDirty || isTemplateDirty

  useBlocker({
    shouldBlockFn: () => {
      if (isNavigatingAfterSave.current) return false
      return !window.confirm('Existem alterações não salvas. Deseja sair mesmo assim?')
    },
    enableBeforeUnload: mode !== 'create' && isDirty,
    disabled: mode === 'create' || !isDirty,
  })

  useEffect(
    function populateFormFromDetail() {
      const value = detail.data
      if (!value) return
      const configuration = {
        name: value.name,
        description: value.description,
        status: value.status,
        application: value.application,
        accessClassification: value.accessClassification ?? 'Interno',
      }
      form.reset(configuration, { keepDirty: false, keepTouched: false })
      setSavedConfiguration(configuration)
      const normalizedContent = normalizeDocumentTemplateContent(value.content)
      setContent(normalizedContent)
      setSavedContent(normalizedContent)
      const normalizedVariables = normalizeDocumentTemplateVariables(value.variables)
      setVariables(normalizedVariables)
      setSavedVariables(normalizedVariables)
    },
    [detail.data, form],
  )

  function handleRetry() {
    void detail.refetch()
  }

  function handleDeleteRequest() {
    if (mode === 'edit') setIsDeleteDialogOpen(true)
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (!actions.isDeleting) setIsDeleteDialogOpen(open)
  }

  async function handleDeleteConfirm() {
    if (mode !== 'edit' || !documentSpecificationId) return
    const response = await deleteDocumentSpecification(documentSpecificationId)
    if (response.isFailure) {
      toast.error(response.errorMessage)
      return
    }
    isNavigatingAfterSave.current = true
    setIsDeleted(true)
    await navigateTo('documentSpecifications', { replace: true })
  }

  function handleCatalogRetry() {
    void catalog.areas.refetch()
    void topics.refetch()
  }

  function handleContentChange(nextContent: DocumentTemplateContent) {
    setContent(nextContent)
  }

  function handleAddVariable(variable: DocumentTemplateVariable) {
    setVariables(function addVariable(previous) {
      return [...previous, variable]
    })
  }

  function handleUpdateVariable(
    previousTechnicalName: string,
    variable: DocumentTemplateVariable,
  ) {
    setVariables((previous) =>
      previous.map((current) =>
        current.technicalName === previousTechnicalName ? variable : current,
      ),
    )
    if (previousTechnicalName !== variable.technicalName)
      setContent(
        (previous) =>
          replaceTemplateVariableTokens(
            previous,
            previousTechnicalName,
            variable.technicalName,
          ) as DocumentTemplateContent,
      )
  }

  function handleRemoveVariable(variable: DocumentTemplateVariable) {
    const systemTechnicalName =
      variable.systemTechnicalName ??
      SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.find(
        (systemVariable) => systemVariable.technicalName === variable.technicalName,
      )?.technicalName
    if (systemTechnicalName) return

    setVariables((previous) =>
      previous.filter((current) => current.technicalName !== variable.technicalName),
    )
    setContent(
      (previous) =>
        removeTemplateVariableTokens(
          previous,
          variable.technicalName,
        ) as DocumentTemplateContent,
    )
  }

  const handleEditorReady = useCallback((insert: (name: string) => void) => {
    setInsertVariable(() => insert)
  }, [])

  function handleApplicationScope(value: string) {
    if (value !== 'global' && value !== 'legal_context') return
    const scope = value
    const loadedScope =
      savedConfiguration?.application.scope ?? detail.data?.application.scope
    if (scope === application.scope) return
    if (loadedScope === scope && !isConfigurationDirty) return
    if (
      scope === 'global' &&
      application.scope === 'legal_context' &&
      (application.legalAreaIds.length > 0 ||
        Object.keys(application.legalTopicIdsByArea).length > 0) &&
      !window.confirm(
        'Trocar para aplicação global removerá as áreas e temas selecionados. Deseja continuar?',
      )
    )
      return
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

  function handleApplicationMoment(value: string) {
    if (
      value !== 'consultation' &&
      value !== 'formalization' &&
      value !== 'legal_production'
    )
      return
    form.setValue('application.moment', value, { shouldDirty: true })
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

  async function saveConfiguration(values: ConfigurationForm) {
    if (
      shouldBlockLegalConfigurationSubmit(
        values.application.scope,
        catalog.areas.isError,
        topics.isError,
      )
    ) {
      const message =
        'Não foi possível carregar o Catálogo Jurídico. Tente novamente antes de salvar a aplicação jurídica.'
      toast.error(message)
      return false
    }
    if (values.status === 'available' && isTemplateEmpty) {
      const message =
        'Escreva e salve um template válido antes de disponibilizar o modelo.'
      form.setError('status', { type: 'validate', message })
      toast.error(message)
      return false
    }
    if (mode === 'create') return false
    const response = await updateConfiguration({
      id: documentSpecificationId as string,
      request: values,
    })
    if (response.isFailure) {
      toast.error(response.errorMessage)
      return false
    }
    form.reset(values, { keepDirty: false, keepTouched: false })
    setSavedConfiguration(values)
    return true
  }

  async function handleConfigurationSubmit(values: ConfigurationForm) {
    const saved = await saveConfiguration(values)
    if (!saved || mode === 'create') return
    const message = 'Configuração salva com sucesso.'
    toast.success(message)
  }

  async function handleTemplateSave() {
    if (mode === 'create') {
      if (!canSaveModel) return
      const response = await createDocumentSpecification({
        name: watchedConfiguration.name,
        description: watchedConfiguration.description,
        status: watchedConfiguration.status,
        application: watchedConfiguration.application,
        accessClassification: watchedConfiguration.accessClassification,
        content,
        variables,
      })
      if (response.isFailure) {
        toast.error(response.errorMessage)
        return
      }
      isNavigatingAfterSave.current = true
      void navigateTo('documentSpecification', {
        params: { documentSpecificationId: response.body.documentSpecificationId },
        replace: true,
      })
      return
    }
    if (!documentSpecificationId || (!isConfigurationDirty && !isTemplateDirty)) return

    const response = await updateConfiguration({
      id: documentSpecificationId,
      request: {
        ...watchedConfiguration,
        content,
        variables,
      },
    })
    if (response.isFailure) {
      toast.error(response.errorMessage)
      return
    }
    setSavedContent(content)
    setSavedVariables(variables)
    form.reset(watchedConfiguration, { keepDirty: false, keepTouched: false })
    setSavedConfiguration(watchedConfiguration)
    toast.success('Modelo salvo com sucesso.')
  }

  function handleTabChange(tab: string) {
    if (
      tab !== activeTab &&
      mode === 'edit' &&
      isDirty &&
      !window.confirm('Existem alterações não salvas. Deseja trocar de aba mesmo assim?')
    )
      return
    setActiveTab(tab as 'configuration' | 'template')
  }

  const isLoading = mode === 'edit' && detail.isLoading
  const isNotFound = mode === 'edit' && isDocumentSpecificationNotFoundError(detail.error)
  const variablesWithSystem = useMemo(() => variables, [variables])
  const templateText = getDocumentTemplateText(content).trim()
  const isTemplateEmpty = templateText.length === 0
  const isCatalogError = shouldBlockLegalConfigurationSubmit(
    application.scope,
    catalog.areas.isError,
    topics.isError,
  )
  const isApplicationReady =
    application.scope === 'global' ||
    (application.legalAreaIds.length > 0 &&
      application.legalAreaIds.every(
        (areaId) => (application.legalTopicIdsByArea[areaId]?.length ?? 0) > 0,
      ))
  const isConfigurationReady =
    watchedConfiguration.name.trim().length > 0 && isApplicationReady
  const canSaveModel =
    isConfigurationReady &&
    !isCatalogError &&
    (watchedConfiguration.status === 'unavailable' || !isTemplateEmpty)
  const wordCount = templateText ? templateText.split(/\s+/).length : 0
  const modelName = watchedConfiguration.name
  const status = watchedConfiguration.status
  return {
    activeTab,
    actions,
    application,
    canSaveModel,
    catalog,
    content,
    detail,
    form,
    handleAddVariable,
    handleRemoveVariable,
    handleUpdateVariable,
    handleApplicationMoment,
    handleApplicationScope,
    handleAreaToggle,
    handleConfigurationSubmit,
    handleContentChange,
    handleDeleteConfirm,
    handleDeleteDialogOpenChange,
    handleDeleteRequest,
    handleEditorReady,
    handleRetry,
    handleCatalogRetry,
    handleTabChange,
    handleTemplateSave,
    handleTopicToggle,
    isConfigurationDirty,
    isDeleteDialogOpen,
    isDirty,
    isLoading,
    insertVariable,
    isNotFound,
    isCatalogError,
    isTemplateDirty,
    isTemplateEmpty,
    wordCount,
    mode,
    modelName,
    status,
    setInsertVariable,
    topics,
    variables: variablesWithSystem,
    toggleAvailability: () =>
      form.setValue(
        'status',
        watchedConfiguration.status === 'available' ? 'unavailable' : 'available',
        { shouldDirty: true },
      ),
  }
}
import type {
  CreateDocumentSpecificationInput,
  DocumentSpecificationConfigurationUpdate,
  DocumentSpecificationTemplateUpdate,
} from '@hms/core/document-production/domain/structures'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useDocumentSpecificationActions = () => {
  const { documentProductionService } = useRestContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (request: CreateDocumentSpecificationInput) =>
      documentProductionService.createDocumentSpecification(request),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['document-specifications'] }),
  })
  const configuration = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string
      request: DocumentSpecificationConfigurationUpdate
    }) => documentProductionService.updateDocumentSpecificationConfiguration(id, request),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ['document-specification', variables.id],
      }),
  })
  const template = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string
      request: DocumentSpecificationTemplateUpdate
    }) => documentProductionService.updateDocumentSpecificationTemplate(id, request),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ['document-specification', variables.id],
      }),
  })

  return {
    createDocumentSpecification: create.mutateAsync,
    updateConfiguration: configuration.mutateAsync,
    updateTemplate: template.mutateAsync,
    isCreating: create.isPending,
    isUpdatingConfiguration: configuration.isPending,
    isUpdatingTemplate: template.isPending,
    createError: create.error,
    configurationError: configuration.error,
    templateError: template.error,
  }
}

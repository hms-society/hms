import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

export type ChecklistDocumentStatusVariant = 'attention' | 'secondary' | 'success'

export type ChecklistDocumentStatusView = {
  badge: string
  description: string
  isValidated: boolean
  label: string
  subtitle: string
  variant: ChecklistDocumentStatusVariant
}

export function getChecklistDocumentStatusView({
  document,
  hasDocument,
  isValidated,
}: {
  document?: DocumentValidationDocument
  hasDocument: boolean
  isValidated: boolean
}): ChecklistDocumentStatusView {
  if (document?.status === DocumentValidationStatus.Valid || (!document && isValidated)) {
    return {
      badge: 'Validado',
      description: 'validado',
      isValidated: true,
      label: 'Documento validado',
      subtitle: 'Documento validado pelo Motor Documental',
      variant: 'success',
    }
  }

  if (!hasDocument) {
    return {
      badge: 'Não recebido',
      description: 'não recebido',
      isValidated: false,
      label: 'Documento não recebido',
      subtitle: 'Documento ainda não recebido',
      variant: 'secondary',
    }
  }

  switch (document?.status) {
    case DocumentValidationStatus.ResendRequested:
      return {
        badge: 'Reenvio solicitado',
        description: 'reenvio solicitado',
        isValidated: false,
        label: 'Reenvio solicitado',
        subtitle: 'Documento com reenvio solicitado ao cliente',
        variant: 'attention',
      }
    case DocumentValidationStatus.Incomplete:
      return {
        badge: 'Incompleto',
        description: 'documento incompleto',
        isValidated: false,
        label: 'Documento incompleto',
        subtitle: 'Documento incompleto após validação documental',
        variant: 'attention',
      }
    case DocumentValidationStatus.Illegible:
      return {
        badge: 'Ilegível',
        description: 'documento ilegível',
        isValidated: false,
        label: 'Documento ilegível',
        subtitle: 'Documento ilegível após validação documental',
        variant: 'attention',
      }
    case DocumentValidationStatus.Duplicate:
      return {
        badge: 'Duplicado',
        description: 'documento duplicado',
        isValidated: false,
        label: 'Documento duplicado',
        subtitle: 'Documento duplicado após validação documental',
        variant: 'attention',
      }
    case DocumentValidationStatus.NotCorresponding:
      return {
        badge: 'Não corresponde',
        description: 'não corresponde ao item',
        isValidated: false,
        label: 'Documento não correspondente',
        subtitle: 'Documento não corresponde ao item do checklist',
        variant: 'attention',
      }
    case DocumentValidationStatus.NotLinked:
      return {
        badge: 'Sem vínculo',
        description: 'sem vínculo documental',
        isValidated: false,
        label: 'Documento sem vínculo',
        subtitle: 'Documento sem vínculo seguro com o checklist',
        variant: 'attention',
      }
    case DocumentValidationStatus.ProcessingFailure:
      return {
        badge: 'Falha',
        description: 'falha no processamento',
        isValidated: false,
        label: 'Falha no processamento',
        subtitle: 'Documento com falha no processamento',
        variant: 'attention',
      }
    default:
      return {
        badge: 'Recebido',
        description: 'aguardando validação documental',
        isValidated: false,
        label: 'Aguardando validação',
        subtitle: 'Documento recebido e aguardando validação',
        variant: 'attention',
      }
  }
}

export function getChecklistDocumentStatusLabel(status?: DocumentValidationStatus) {
  switch (status) {
    case DocumentValidationStatus.Valid:
      return 'Documento validado'
    case DocumentValidationStatus.NotLinked:
      return 'Documento sem vínculo'
    case DocumentValidationStatus.Illegible:
      return 'Documento ilegível'
    case DocumentValidationStatus.Incomplete:
      return 'Documento incompleto'
    case DocumentValidationStatus.Duplicate:
      return 'Documento duplicado'
    case DocumentValidationStatus.NotCorresponding:
      return 'Documento não correspondente'
    case DocumentValidationStatus.ProcessingFailure:
      return 'Falha no processamento'
    case DocumentValidationStatus.ResendRequested:
      return 'Reenvio solicitado'
    default:
      return 'Aguardando validação'
  }
}

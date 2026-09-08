import type {
  FormalizationSignatory,
  FormalizationSignatoryDocument,
  FormalizationSignatureField,
  FormalizationSignaturePreview,
} from '@hms/core/formalization/domain/entities'
import {
  type FormalizationSignatureConfiguration,
  FormalizationSignatureStatus,
  FormalizationSignaturePreviewState,
  type FormalizationSignaturePreviewState as PreviewState,
  type FormalizationSignatoryRole,
  type FormalizationSignatureFieldType,
} from '@hms/core/formalization/domain/structures'

import type {
  DrizzleFormalizationSignatory,
  DrizzleFormalizationSignatoryDocument,
  DrizzleFormalizationSignatureField,
  DrizzleFormalizationSignaturePreview,
} from '@/formalization/database/drizzle/types/entities'

export class DrizzleFormalizationSignatureMapper {
  toSignatory(record: DrizzleFormalizationSignatory): FormalizationSignatory {
    return {
      id: record.id,
      formalizationId: record.formalizationId,
      personId: record.personId,
      role: record.role as FormalizationSignatoryRole,
      position: record.position,
      selectedChannels: record.selectedChannels.filter(
        (channel): channel is 'email' | 'whatsapp' =>
          channel === 'email' || channel === 'whatsapp',
      ),
      createdByCollaboratorId: record.createdByCollaboratorId,
      createdAt: record.createdAt,
      updatedByCollaboratorId: record.updatedByCollaboratorId,
      updatedAt: record.updatedAt,
    }
  }

  toAssignment(
    record: DrizzleFormalizationSignatoryDocument,
  ): FormalizationSignatoryDocument {
    return {
      id: record.id,
      formalizationId: record.formalizationId,
      signatoryId: record.signatoryId,
      documentId: record.documentId,
      documentVersionId: record.documentVersionId,
      createdByCollaboratorId: record.createdByCollaboratorId,
      createdAt: record.createdAt,
    }
  }

  toPreview(record: DrizzleFormalizationSignaturePreview): FormalizationSignaturePreview {
    return {
      id: record.id,
      formalizationId: record.formalizationId,
      documentId: record.documentId,
      documentVersionId: record.documentVersionId,
      fileId: record.fileId ?? undefined,
      contentChecksumSha256: record.contentChecksumSha256 ?? undefined,
      pdfChecksumSha256: record.pdfChecksumSha256 ?? undefined,
      converterVersion: record.converterVersion ?? undefined,
      pageCount: record.pageCount ?? undefined,
      pages: [...record.pages],
      byteSize: record.byteSize ?? undefined,
      state: record.state as PreviewState,
      attemptsCount: record.attemptsCount,
      attemptToken: record.attemptToken ?? undefined,
      processingStartedAt: record.processingStartedAt ?? undefined,
      leaseExpiresAt: record.leaseExpiresAt ?? undefined,
      failureCode: record.failureCode as FormalizationSignaturePreview['failureCode'],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }

  toField(record: DrizzleFormalizationSignatureField): FormalizationSignatureField {
    return {
      id: record.id,
      formalizationId: record.formalizationId,
      signatoryDocumentId: record.signatoryDocumentId,
      previewId: record.previewId,
      type: record.type as FormalizationSignatureFieldType,
      page: record.page,
      positionX: record.positionX,
      positionY: record.positionY,
      width: record.width,
      height: record.height,
      createdByCollaboratorId: record.createdByCollaboratorId,
      createdAt: record.createdAt,
      updatedByCollaboratorId: record.updatedByCollaboratorId,
      updatedAt: record.updatedAt,
    }
  }

  toConfiguration(
    formalization: {
      readonly id: string
      readonly version: number
      readonly status: string
      readonly documentsConfirmedAt: Date | null
    },
    signatories: readonly FormalizationSignatory[],
    assignments: readonly FormalizationSignatoryDocument[],
    previews: readonly FormalizationSignaturePreview[],
    fields: readonly FormalizationSignatureField[],
  ): FormalizationSignatureConfiguration {
    const assignmentsBySignatory = new Map<string, string[]>()
    for (const assignment of assignments) {
      const documentIds = assignmentsBySignatory.get(assignment.signatoryId) ?? []
      documentIds.push(assignment.documentId)
      assignmentsBySignatory.set(assignment.signatoryId, documentIds)
    }

    const fieldsByPreview = new Map<string, FormalizationSignatureField[]>()
    for (const field of fields) {
      const previewFields = fieldsByPreview.get(field.previewId) ?? []
      previewFields.push(field)
      fieldsByPreview.set(field.previewId, previewFields)
    }

    const documents = previews.map((preview) => {
      const previewView = {
        previewId: preview.id,
        state: preview.state,
        ...(preview.failureCode ? { failureCode: preview.failureCode } : {}),
        ...(preview.pageCount ? { pageCount: preview.pageCount } : {}),
        pages: [...preview.pages],
      }

      return {
        documentId: preview.documentId,
        documentVersionId: preview.documentVersionId,
        name: preview.documentId,
        reviewStatus: 'approved',
        preview: previewView,
        fields: (fieldsByPreview.get(preview.id) ?? []).map((field) => ({
          fieldId: field.id,
          signatoryId:
            assignments.find((assignment) => assignment.id === field.signatoryDocumentId)
              ?.signatoryId ?? '',
          previewId: field.previewId,
          type: field.type,
          page: field.page,
          positionX: field.positionX,
          positionY: field.positionY,
          width: field.width,
          height: field.height,
        })),
      }
    })

    const total = previews.length
    const pending = previews.filter(
      ({ state }) => state === FormalizationSignaturePreviewState.Pending,
    ).length
    const processing = previews.filter(
      ({ state }) => state === FormalizationSignaturePreviewState.Processing,
    ).length
    const ready = previews.filter(
      ({ state }) =>
        state === FormalizationSignaturePreviewState.Ready ||
        state === FormalizationSignaturePreviewState.Stale,
    ).length
    const failed = previews.filter(
      ({ state }) => state === FormalizationSignaturePreviewState.Failed,
    ).length

    const base = {
      formalizationId: formalization.id,
      version: formalization.version,
      editable: false,
      status: FormalizationSignatureStatus.InitializationRequired,
      previewPreparation: { total, pending, processing, ready, failed },
      signatories: signatories.map((signatory) => ({
        signatoryId: signatory.id,
        personId: signatory.personId,
        role: signatory.role,
        name: signatory.personId,
        removable: signatory.role === 'additional_collaborator',
        availableChannels: [],
        selectedChannels: [...signatory.selectedChannels],
        documentIds: assignmentsBySignatory.get(signatory.id) ?? [],
      })),
      documents,
      readiness: { ready: false, assignmentCount: assignments.length, issues: [] },
    }

    return this.refreshDerivedState({
      ...base,
      ...this.deriveLifecycleState(formalization, base),
    })
  }

  refreshDerivedState(
    configuration: FormalizationSignatureConfiguration,
  ): FormalizationSignatureConfiguration {
    const readiness = this.deriveReadiness(configuration)
    const status =
      configuration.status === FormalizationSignatureStatus.Locked ||
      configuration.status === FormalizationSignatureStatus.ReadOnly ||
      configuration.status === FormalizationSignatureStatus.PreparingConfiguration ||
      configuration.status === FormalizationSignatureStatus.InitializationRequired
        ? configuration.status
        : readiness.ready
          ? FormalizationSignatureStatus.ReadyForSending
          : FormalizationSignatureStatus.Configuring

    return {
      ...configuration,
      status,
      editable:
        status === FormalizationSignatureStatus.PreparingConfiguration ||
        status === FormalizationSignatureStatus.Configuring ||
        status === FormalizationSignatureStatus.ReadyForSending,
      readiness,
    }
  }

  private deriveLifecycleState(
    formalization: {
      readonly status: string
      readonly documentsConfirmedAt: Date | null
    },
    configuration: FormalizationSignatureConfiguration,
  ): Pick<FormalizationSignatureConfiguration, 'status' | 'editable'> {
    if (configuration.documents.length === 0) {
      return {
        status: FormalizationSignatureStatus.InitializationRequired,
        editable: false,
      }
    }
    if (!formalization.documentsConfirmedAt) {
      return { status: FormalizationSignatureStatus.Locked, editable: false }
    }
    if (
      configuration.previewPreparation.pending > 0 ||
      configuration.previewPreparation.processing > 0
    ) {
      return {
        status: FormalizationSignatureStatus.PreparingConfiguration,
        editable: true,
      }
    }
    if (formalization.status !== 'in_progress') {
      return { status: FormalizationSignatureStatus.ReadOnly, editable: false }
    }
    return {
      status: FormalizationSignatureStatus.Configuring,
      editable: true,
    }
  }

  private deriveReadiness(
    configuration: FormalizationSignatureConfiguration,
  ): FormalizationSignatureConfiguration['readiness'] {
    const issues: FormalizationSignatureConfiguration['readiness']['issues'][number][] =
      []
    if (
      configuration.status === FormalizationSignatureStatus.InitializationRequired ||
      configuration.documents.length === 0
    ) {
      issues.push({ path: 'configuration', code: 'initialization_required' })
    }
    if (configuration.status === FormalizationSignatureStatus.Locked) {
      issues.push({ path: 'configuration', code: 'package_unconfirmed' })
    }

    for (const document of configuration.documents) {
      const preview = document.preview
      if (!preview) {
        issues.push({
          path: `documents.${document.documentId}.preview`,
          code: 'preparation_pending',
        })
      } else if (
        preview.state === FormalizationSignaturePreviewState.Pending ||
        preview.state === FormalizationSignaturePreviewState.Processing
      ) {
        issues.push({
          path: `documents.${document.documentId}.preview`,
          code: 'preparation_pending',
        })
      } else if (preview.state === FormalizationSignaturePreviewState.Failed) {
        issues.push({
          path: `documents.${document.documentId}.preview`,
          code: 'preview_failed',
        })
      } else if (preview.state === FormalizationSignaturePreviewState.Stale) {
        issues.push({
          path: `documents.${document.documentId}.preview`,
          code: 'preparation_pending',
        })
      }
      if (document.reviewStatus !== 'approved') {
        issues.push({
          path: `documents.${document.documentId}`,
          code: 'version_not_approved',
        })
      }
      const isAssigned = configuration.signatories.some((signatory) =>
        signatory.documentIds.includes(document.documentId),
      )
      if (!isAssigned) {
        issues.push({
          path: `documents.${document.documentId}`,
          code: 'document_unassigned',
        })
      }
    }

    for (const signatory of configuration.signatories) {
      if (signatory.documentIds.length === 0) {
        issues.push({
          path: `signatories.${signatory.signatoryId}`,
          code: 'signatory_unassigned',
        })
      }
      if (signatory.selectedChannels.length === 0) {
        issues.push({
          path: `signatories.${signatory.signatoryId}.selectedChannels`,
          code: 'selected_channel_missing',
        })
      } else if (
        signatory.selectedChannels.some(
          (channel) => !signatory.availableChannels.includes(channel),
        )
      ) {
        issues.push({
          path: `signatories.${signatory.signatoryId}.selectedChannels`,
          code: 'selected_channel_unavailable',
        })
      }
    }

    for (const document of configuration.documents) {
      for (const signatory of configuration.signatories) {
        if (!signatory.documentIds.includes(document.documentId)) continue
        const hasField = document.fields.some(
          (field) => field.signatoryId === signatory.signatoryId,
        )
        if (!hasField) {
          issues.push({
            path: `documents.${document.documentId}.fields.${signatory.signatoryId}`,
            code: 'field_missing',
          })
        }
      }
    }

    return {
      ready: issues.length === 0,
      assignmentCount: configuration.readiness.assignmentCount,
      issues,
    }
  }
}

import type { Broker, IdProvider } from '../../shared/interfaces'
import type {
  FormalizationSignatureField,
  FormalizationSignatory,
  FormalizationSignatoryDocument,
} from '../domain/entities'
import { FormalizationSignaturePreviewBatchGenerationRequestedEvent } from '../domain/events'
import { FormalizationSignatureAssignmentError } from '../domain/errors'
import type {
  FormalizationSignatureConfiguration,
  FormalizationSignatureFieldView,
  FormalizationSignatureSourceDocument,
} from '../domain/structures'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
} from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

export abstract class FormalizationSignatureConfigurationUseCase<
  Request,
  Response = void,
> extends FormalizationUseCase<Request, Response> {
  protected async buildSignaturePersistenceState(
    configuration: FormalizationSignatureConfiguration,
    formalizationId: string,
    actorId: string,
    occurredAt: Date,
    sourceReader: FormalizationSignatureSourceReader,
    idProvider: IdProvider,
  ): Promise<{
    readonly signatories: readonly FormalizationSignatory[]
    readonly assignments: readonly FormalizationSignatoryDocument[]
    readonly fields: readonly FormalizationSignatureField[]
  }> {
    const sourceDocuments = await sourceReader.listCurrentDocuments(formalizationId)
    const sourceDocumentsById = new Map(
      sourceDocuments.map((document) => [document.documentId, document]),
    )

    const assignmentIds = new Map<string, string>()
    const signatories = configuration.signatories.map((signatory, index) => ({
      id: signatory.signatoryId,
      formalizationId,
      role: signatory.role,
      personId: signatory.personId,
      position: index + 1,
      selectedChannels: [...signatory.selectedChannels],
      createdByCollaboratorId: actorId,
      createdAt: occurredAt,
      updatedByCollaboratorId: actorId,
      updatedAt: occurredAt,
    }))

    const assignments: FormalizationSignatoryDocument[] = []

    for (const signatory of configuration.signatories) {
      for (const documentId of signatory.documentIds) {
        const sourceDocument = sourceDocumentsById.get(documentId)
        if (!sourceDocument) {
          throw new FormalizationSignatureAssignmentError(
            'O documento não pertence à versão atual do pacote.',
          )
        }
        const assignmentId = idProvider.generate()
        assignmentIds.set(`${signatory.signatoryId}:${documentId}`, assignmentId)
        assignments.push({
          id: assignmentId,
          formalizationId,
          signatoryId: signatory.signatoryId,
          documentId,
          documentVersionId: sourceDocument.documentVersionId,
          createdByCollaboratorId: actorId,
          createdAt: occurredAt,
        })
      }
    }

    const fields: FormalizationSignatureField[] = []
    for (const document of configuration.documents) {
      for (const field of document.fields) {
        const signatoryDocumentId = assignmentIds.get(
          `${field.signatoryId}:${document.documentId}`,
        )
        if (!signatoryDocumentId) continue
        fields.push({
          id: field.fieldId,
          formalizationId,
          signatoryDocumentId,
          previewId: field.previewId,
          type: field.type,
          page: field.page,
          positionX: field.positionX,
          positionY: field.positionY,
          width: field.width,
          height: field.height,
          createdByCollaboratorId: actorId,
          createdAt: occurredAt,
          updatedByCollaboratorId: actorId,
          updatedAt: occurredAt,
        })
      }
    }

    return { signatories, assignments, fields }
  }

  protected findSignatureDocument(
    configuration: FormalizationSignatureConfiguration,
    documentId: string,
  ): FormalizationSignatureConfiguration['documents'][number] {
    const document = configuration.documents.find(
      (item) => item.documentId === documentId,
    )
    if (!document) {
      throw new FormalizationSignatureAssignmentError(
        'O documento não pertence à formalização.',
      )
    }
    return document
  }

  protected findSignatureSignatory(
    configuration: FormalizationSignatureConfiguration,
    signatoryId: string,
  ): FormalizationSignatureConfiguration['signatories'][number] {
    const signatory = configuration.signatories.find(
      (item) => item.signatoryId === signatoryId,
    )
    if (!signatory) {
      throw new FormalizationSignatureAssignmentError(
        'O signatário não pertence à formalização.',
      )
    }
    return signatory
  }

  protected replaceDocumentFields(
    configuration: FormalizationSignatureConfiguration,
    documentId: string,
    fields: readonly FormalizationSignatureFieldView[],
  ): FormalizationSignatureConfiguration {
    return {
      ...configuration,
      documents: configuration.documents.map((document) =>
        document.documentId === documentId ? { ...document, fields } : document,
      ),
    }
  }

  protected getCurrentSourceDocument(
    sourceDocuments: readonly FormalizationSignatureSourceDocument[],
    documentId: string,
  ): FormalizationSignatureSourceDocument {
    const document = sourceDocuments.find((item) => item.documentId === documentId)
    if (!document) {
      throw new FormalizationSignatureAssignmentError(
        'O documento não pertence à versão atual do pacote.',
      )
    }
    return document
  }

  protected async publishPendingPreviewBatch(
    formalizationId: string,
    previewIds: readonly string[],
    scheduledAt: Date,
    configurationRepository: FormalizationSignatureConfigurationRepository,
    broker: Broker,
  ): Promise<void> {
    const items: Array<{
      readonly previewId: string
      readonly attemptToken: string
    }> = []
    for (const previewId of previewIds) {
      const claim = await configurationRepository.schedulePendingPreview(
        previewId,
        scheduledAt,
      )
      if (claim)
        items.push({ previewId: claim.previewId, attemptToken: claim.attemptToken })
    }
    if (items.length === 0) return

    await broker.publish(
      new FormalizationSignaturePreviewBatchGenerationRequestedEvent({
        formalizationId,
        items,
        occurredAt: scheduledAt.toISOString(),
      }),
    )
  }
}

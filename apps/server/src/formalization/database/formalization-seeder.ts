import { Inject, Injectable } from '@nestjs/common'
import type { Client, Collaborator } from '@hms/core/identity/domain/entities'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import type { Intake } from '@hms/core/intake/domain/entities'
import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import type {
  FormalizationSignatureRecipient,
  FormalizationSignatureRequestDocument,
} from '@hms/core/formalization/domain/entities'
import type {
  DynamicForm,
  DynamicFormAnswer,
  DynamicFormAnswerValue,
} from '@hms/core/shared/domain'
import { AppError } from '@hms/core/shared/domain/errors'
import type {
  Formalization,
  FormalizationCreation,
} from '@hms/core/formalization/domain/entities'
import {
  fakeFormalization,
  fakeFormalizationSignatureArtifact,
  fakeFormalizationSignatureInvitation,
  fakeFormalizationSignatureProtocol,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
  fakeFormalizationSignatureSnapshot,
} from '@hms/core/formalization/domain/entities/fakers'
import type {
  FormalizationsRepository,
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
} from '@hms/core/formalization/interfaces'

import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import type { FormalizationSignatureGatewayTransaction } from '@hms/core/formalization/interfaces'
import { DrizzleFormalizationSignatureConfigurationRepository } from '@/formalization/database/drizzle/repositories'

export type FormalizationSeedReferences = {
  readonly intake: Intake
  readonly consultation: Consultation
  readonly client: Client
  readonly assignedLawyer: Collaborator
  readonly contractForm: DynamicForm
  readonly formalizationId?: string
  readonly seedMode?: 'confirmed' | 'financial-form-draft' | 'completed'
}

export type CompletedFormalizationSignatureSeedReferences = {
  readonly formalizationId: string
  readonly formalizationVersion: number
  readonly client: Client
  readonly assignedLawyer: Collaborator
  readonly documentVersions: readonly DocumentVersion[]
  readonly signaturePdfFileIds: {
    readonly original: readonly string[]
    readonly signed: readonly string[]
  }
}

type CompletedSignaturePerson = {
  readonly personId: string
  readonly actorKind: 'client' | 'collaborator'
  readonly role: 'client' | 'responsible_lawyer'
  readonly displayName: string
}

@Injectable()
export class FormalizationSeeder {
  static readonly SEEDED_FORMALIZATION_ID = '00000000-0000-4000-8000-000000000701'
  static readonly SEEDED_DRAFT_FORMALIZATION_ID = '00000000-0000-4000-8000-000000000702'
  static readonly SEEDED_COMPLETED_FORMALIZATION_ID =
    '00000000-0000-4000-8000-000000000703'
  static readonly SEEDED_COMPLETED_SIGNATURE_REQUEST_ID =
    '00000000-0000-4000-8000-000000000801'
  static readonly SEEDED_COMPLETED_SIGNATURE_SNAPSHOT_ID =
    '00000000-0000-4000-8000-000000000802'
  static readonly SEEDED_COMPLETED_SIGNATURE_DATE = new Date('2026-08-20T15:55:00.000Z')
  static readonly SEEDED_CONFIRMATION_DATE = new Date('2026-08-20T15:15:00.000Z')

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    private readonly signatureGatewayTransaction: FormalizationSignatureGatewayTransaction & {
      removeAll(): Promise<void>
    },
    @Inject(FORMALIZATION_REPOSITORIES.signatureSnapshots)
    private readonly signatureSnapshotsRepository: FormalizationSignatureSnapshotsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    private readonly signatureRequestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    private readonly signatureRequestDocumentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    private readonly signatureRecipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    private readonly signatureRecipientDocumentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    private readonly signatureInvitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    private readonly signatureProtocolsRepository: FormalizationSignatureProtocolsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureArtifacts)
    private readonly signatureArtifactsRepository: FormalizationSignatureArtifactsRepository,
    private readonly signatureConfigurationRepository: DrizzleFormalizationSignatureConfigurationRepository,
  ) {}

  async clear() {
    await this.signatureGatewayTransaction.removeAll()
    await this.formalizationsRepository.removeAll()
  }

  async run(references: FormalizationSeedReferences) {
    const seeded = this.createFormalization(references)
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...creation } = seeded
    return this.formalizationsRepository.addOrGet(creation as FormalizationCreation)
  }

  async seedCompletedSignatures(
    references: CompletedFormalizationSignatureSeedReferences,
  ) {
    if (references.documentVersions.length === 0) {
      throw new AppError(
        'Completed Formalization document versions are required.',
        'Seed Error',
      )
    }

    const requestId = FormalizationSeeder.SEEDED_COMPLETED_SIGNATURE_REQUEST_ID
    const confirmedAt = FormalizationSeeder.SEEDED_COMPLETED_SIGNATURE_DATE
    const people = this.createCompletedSignaturePeople(references)
    const configurationVersion = await this.seedCompletedConfiguration(references, people)

    await this.seedCompletedRequest(references, configurationVersion, confirmedAt)
    const requestDocuments = await this.seedCompletedRequestDocuments(
      references.documentVersions,
      references.signaturePdfFileIds.original,
      requestId,
      confirmedAt,
    )
    const recipients = await this.seedCompletedRecipients(people, requestId, confirmedAt)
    await this.seedCompletedRecipientAssignments(recipients, requestDocuments, requestId)
    await this.seedCompletedRecipientEvidence(recipients, requestId, confirmedAt)
    await this.seedCompletedArtifacts(
      requestDocuments,
      references.signaturePdfFileIds.signed,
      requestId,
      confirmedAt,
    )
  }

  private createFormalization(references: FormalizationSeedReferences) {
    const isFinancialFormDraft = references.seedMode === 'financial-form-draft'
    return fakeFormalization({
      id: this.getFormalizationId(references),
      intakeId: references.intake.id,
      clientId: references.client.id,
      consultationId: references.consultation.id,
      assignedLawyerId: references.assignedLawyer.id,
      legalAreaId: references.intake.legalAreaId,
      legalTopicId: references.intake.legalTopicId,
      contractFormId: references.contractForm.id,
      contractFormSnapshot: {
        dynamicFormId: references.contractForm.id,
        name: references.contractForm.name,
        description: references.contractForm.description,
        fields: references.contractForm.fields,
      },
      contractFormAnswers: this.createFilledFormAnswers(references.contractForm),
      contractFormState: isFinancialFormDraft ? 'open' : 'closed',
      contractFormRevision: 1,
      ...this.createFormalizationLifecycle(references),
      version: 1,
    })
  }

  private getFormalizationId(references: FormalizationSeedReferences) {
    if (references.formalizationId) return references.formalizationId
    if (references.seedMode === 'financial-form-draft') {
      return FormalizationSeeder.SEEDED_DRAFT_FORMALIZATION_ID
    }
    if (references.seedMode === 'completed') {
      return FormalizationSeeder.SEEDED_COMPLETED_FORMALIZATION_ID
    }
    return FormalizationSeeder.SEEDED_FORMALIZATION_ID
  }

  private createFormalizationLifecycle(
    references: FormalizationSeedReferences,
  ): Partial<Formalization> {
    if (references.seedMode === 'financial-form-draft') return {}

    const confirmed = {
      contractFormClosedAt: FormalizationSeeder.SEEDED_CONFIRMATION_DATE,
      contractFormClosedByCollaboratorId: references.assignedLawyer.id,
      documentsConfirmedAt: FormalizationSeeder.SEEDED_CONFIRMATION_DATE,
      documentsConfirmedByCollaboratorId: references.assignedLawyer.id,
      documentsConfirmedRevision: 1,
    }
    if (references.seedMode !== 'completed') return confirmed

    return {
      ...confirmed,
      status: 'completed',
      signatureRequestId: FormalizationSeeder.SEEDED_COMPLETED_SIGNATURE_REQUEST_ID,
      signatureStatus: 'confirmed',
      signatureSubmittedAt: FormalizationSeeder.SEEDED_COMPLETED_SIGNATURE_DATE,
      signatureConfirmedAt: FormalizationSeeder.SEEDED_COMPLETED_SIGNATURE_DATE,
      signatureTerminalAt: FormalizationSeeder.SEEDED_COMPLETED_SIGNATURE_DATE,
      completedAt: new Date('2026-08-20T16:00:00.000Z'),
      completedByCollaboratorId: references.assignedLawyer.id,
      contractingConfirmationKey: '00000000-0000-4000-8000-000000000803',
    }
  }

  private createCompletedSignaturePeople(
    references: CompletedFormalizationSignatureSeedReferences,
  ): readonly CompletedSignaturePerson[] {
    return [
      {
        personId: references.client.id,
        actorKind: 'client',
        role: 'client',
        displayName:
          references.client.type === 'natural'
            ? references.client.name
            : (references.client.tradeName ?? references.client.legalName),
      },
      {
        personId: references.assignedLawyer.id,
        actorKind: 'collaborator',
        role: 'responsible_lawyer',
        displayName: references.assignedLawyer.professionalName,
      },
    ]
  }

  private async seedCompletedConfiguration(
    references: CompletedFormalizationSignatureSeedReferences,
    people: readonly CompletedSignaturePerson[],
  ) {
    const configuredAt = new Date('2026-08-20T15:20:00.000Z')
    const signatories = people.map((person, index) => ({
      id: `00000000-0000-4000-8000-00000000084${index}`,
      formalizationId: references.formalizationId,
      personId: person.personId,
      role: person.role,
      position: index + 1,
      selectedChannels: ['email' as const],
      createdByCollaboratorId: references.assignedLawyer.id,
      createdAt: configuredAt,
      updatedByCollaboratorId: references.assignedLawyer.id,
      updatedAt: configuredAt,
    }))
    const assignments = signatories.flatMap((signatory, signatoryIndex) =>
      references.documentVersions.map((version, documentIndex) => ({
        id: `00000000-0000-4000-8000-000000000${890 + signatoryIndex * 2 + documentIndex}`,
        formalizationId: references.formalizationId,
        signatoryId: signatory.id,
        documentId: version.documentId,
        documentVersionId: version.id,
        createdByCollaboratorId: references.assignedLawyer.id,
        createdAt: configuredAt,
      })),
    )
    const configuration =
      await this.signatureConfigurationRepository.replaceConfiguration({
        formalizationId: references.formalizationId,
        expectedFormalizationVersion: references.formalizationVersion,
        actorId: references.assignedLawyer.id,
        occurredAt: configuredAt,
        signatories,
        assignments,
        fields: [],
      })
    if (!configuration) {
      throw new AppError(
        'The completed Formalization signature configuration could not be seeded.',
        'Seed Error',
      )
    }

    return configuration.version
  }

  private async seedCompletedRequest(
    references: CompletedFormalizationSignatureSeedReferences,
    configurationVersion: number,
    confirmedAt: Date,
  ) {
    const requestId = FormalizationSeeder.SEEDED_COMPLETED_SIGNATURE_REQUEST_ID
    const snapshot = fakeFormalizationSignatureSnapshot({
      id: FormalizationSeeder.SEEDED_COMPLETED_SIGNATURE_SNAPSHOT_ID,
      formalizationId: references.formalizationId,
      formalizationVersion: configurationVersion,
      signatureConfigurationVersion: configurationVersion,
      snapshotHash: 'a'.repeat(64),
      createdBy: references.assignedLawyer.id,
      createdAt: new Date('2026-08-20T15:25:00.000Z'),
    })
    await this.signatureSnapshotsRepository.add(snapshot)
    await this.signatureRequestsRepository.add(
      fakeFormalizationSignatureRequest({
        id: requestId,
        formalizationId: references.formalizationId,
        signatureConfigurationVersion: configurationVersion,
        snapshotId: snapshot.id,
        confirmationKeyHash: 'b'.repeat(64),
        status: 'confirmed',
        version: 4,
        createdBy: references.assignedLawyer.id,
        createdAt: new Date('2026-08-20T15:25:00.000Z'),
        updatedAt: confirmedAt,
        sentAt: new Date('2026-08-20T15:30:00.000Z'),
        submittedAt: new Date('2026-08-20T15:50:00.000Z'),
        confirmedAt,
        terminalAt: confirmedAt,
      }),
    )
  }

  private async seedCompletedRequestDocuments(
    documentVersions: readonly DocumentVersion[],
    originalPdfFileIds: readonly string[],
    requestId: string,
    confirmedAt: Date,
  ) {
    const requestDocuments = documentVersions.map((version, index) => {
      const originalPdfFileId = originalPdfFileIds[index]
      if (!originalPdfFileId) {
        throw new AppError(
          'The completed Formalization original PDF reference could not be resolved.',
          'Seed Error',
        )
      }

      return fakeFormalizationSignatureRequestDocument({
        id: `00000000-0000-4000-8000-00000000081${index}`,
        requestId,
        sourceDocumentId: version.documentId,
        sourceDocumentVersionId: version.id,
        signaturePreviewId: `00000000-0000-4000-8000-00000000082${index}`,
        unsignedPrivateFileId: originalPdfFileId,
        unsignedSha256: `${index + 1}`.repeat(64),
        position: index + 1,
        status: 'confirmed',
        version: 3,
        provisionedAt: new Date('2026-08-20T15:28:00.000Z'),
        submittedAt: new Date('2026-08-20T15:50:00.000Z'),
        confirmedAt,
        createdAt: new Date('2026-08-20T15:25:00.000Z'),
        updatedAt: confirmedAt,
      })
    })
    await this.signatureRequestDocumentsRepository.addMany(requestDocuments)
    return requestDocuments
  }

  private async seedCompletedRecipients(
    people: readonly CompletedSignaturePerson[],
    requestId: string,
    confirmedAt: Date,
  ) {
    const recipients = people.map((person, index) =>
      fakeFormalizationSignatureRecipient({
        id: `00000000-0000-4000-8000-00000000083${index}`,
        requestId,
        signatoryId: `00000000-0000-4000-8000-00000000084${index}`,
        personId: person.personId,
        actorKind: person.actorKind,
        displayNameSnapshot: person.displayName,
        deliveryChannel: 'email',
        status: 'confirmed',
        version: 4,
        invitedAt: new Date('2026-08-20T15:30:00.000Z'),
        submittedAt: new Date('2026-08-20T15:50:00.000Z'),
        submissionObservationId: (index === 0 ? '9' : 'a').repeat(64),
        confirmedAt,
        createdAt: new Date('2026-08-20T15:25:00.000Z'),
        updatedAt: confirmedAt,
      }),
    )
    await this.signatureRecipientsRepository.addMany(recipients)
    return recipients
  }

  private async seedCompletedRecipientAssignments(
    recipients: readonly FormalizationSignatureRecipient[],
    requestDocuments: readonly FormalizationSignatureRequestDocument[],
    requestId: string,
  ) {
    await this.signatureRecipientDocumentsRepository.addMany(
      recipients.flatMap((recipient, recipientIndex) =>
        requestDocuments.map((document, documentIndex) => ({
          id: `00000000-0000-4000-8000-000000000${850 + recipientIndex * 2 + documentIndex}`,
          requestId,
          recipientId: recipient.id,
          requestDocumentId: document.id,
          createdAt: new Date('2026-08-20T15:25:00.000Z'),
        })),
      ),
    )
  }

  private async seedCompletedRecipientEvidence(
    recipients: readonly FormalizationSignatureRecipient[],
    requestId: string,
    confirmedAt: Date,
  ) {
    await Promise.all(
      recipients.flatMap((recipient, index) => [
        this.signatureInvitationsRepository.add(
          fakeFormalizationSignatureInvitation({
            id: `00000000-0000-4000-8000-00000000086${index}`,
            requestId,
            recipientId: recipient.id,
            tokenHash: `${index + 3}`.repeat(64),
            status: 'consumed',
            deliveryStatus: 'delivered',
            expiresAt: new Date('2026-08-27T15:30:00.000Z'),
            deliveredAt: new Date('2026-08-20T15:30:00.000Z'),
            consumedAt: new Date('2026-08-20T15:35:00.000Z'),
            createdAt: new Date('2026-08-20T15:30:00.000Z'),
          }),
        ),
        this.signatureProtocolsRepository.add(
          fakeFormalizationSignatureProtocol({
            id: `00000000-0000-4000-8000-00000000087${index}`,
            requestId,
            recipientId: recipient.id,
            number: `HMS-2026-000${index + 1}`,
            artifactSetHash: `${index + 5}`.repeat(64),
            confirmedAt,
          }),
        ),
      ]),
    )
  }

  private async seedCompletedArtifacts(
    requestDocuments: readonly FormalizationSignatureRequestDocument[],
    signedPdfFileIds: readonly string[],
    requestId: string,
    confirmedAt: Date,
  ) {
    await Promise.all(
      requestDocuments.map((document, index) => {
        const signedPdfFileId = signedPdfFileIds[index]
        if (!signedPdfFileId) {
          throw new AppError(
            'The completed Formalization signed PDF reference could not be resolved.',
            'Seed Error',
          )
        }

        return this.signatureArtifactsRepository.add(
          fakeFormalizationSignatureArtifact({
            id: `00000000-0000-4000-8000-00000000088${index}`,
            requestId,
            requestDocumentId: document.id,
            kind: 'signed_pdf',
            privateFileId: signedPdfFileId,
            sha256: `${index + 7}`.repeat(64),
            preservedAt: confirmedAt,
          }),
        )
      }),
    )
  }

  private createFilledFormAnswers(form: DynamicForm): DynamicFormAnswer[] {
    return form.fields.map((field) => ({
      fieldId: field.id,
      value: this.getConfirmedAnswerValue(field.key),
    }))
  }

  private getConfirmedAnswerValue(fieldKey: string): DynamicFormAnswerValue {
    const values: Record<string, DynamicFormAnswerValue> = {
      service_type: 'representation',
      payment_method: 'monthly',
      fixed_fee: 2500,
      success_fee: 10,
      installments: 12,
      start_date: '2026-09-01',
      has_exclusivity: false,
      commercial_notes: 'Configuração inicial confirmada para o atendimento.',
    }
    const value = values[fieldKey]
    if (value === undefined) {
      throw new AppError(
        `The Formalization form field ${fieldKey} has no seed value.`,
        'Seed Error',
      )
    }
    return value
  }
}

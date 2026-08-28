import { CommunicationChannel } from '@hms/core/communication/domain/structures'
import { z } from 'zod'

import { legalCollaboratorProfileSchema } from '../identity/schemas/collaborator-profile-schema'

const MAX_PAGE = 10_000
const MAX_ITEMS = 100
const MAX_TEXT_LENGTH = 200

const uuidSchema = z.uuid()
const expectedVersionSchema = z.number().finite().int().min(1)
const pageSchema = z.coerce.number().finite().int().min(1).max(MAX_PAGE).default(1)
const limitSchema = z.coerce.number().finite().int().min(1).max(MAX_ITEMS).default(20)
const optionalSearchSchema = z
  .string()
  .trim()
  .max(MAX_TEXT_LENGTH)
  .transform((value) => value || undefined)
  .optional()

const communicationChannelSchema = z.enum(CommunicationChannel)
const signatoryRoleSchema = z.enum([
  'client',
  'responsible_lawyer',
  'additional_collaborator',
])
const signatureFieldTypeSchema = z.literal('signature')
const previewStateSchema = z.enum([
  'pending',
  'processing',
  'ready',
  'failed',
  'stale',
  'cleanup_pending',
])
const previewFailureCodeSchema = z.enum([
  'document_version_file_unavailable',
  'conversion_rejected',
  'conversion_unavailable',
  'invalid_pdf',
  'storage_unavailable',
])
const readinessIssueCodeSchema = z.enum([
  'package_unconfirmed',
  'initialization_required',
  'preparation_pending',
  'preview_failed',
  'version_not_approved',
  'document_unassigned',
  'signatory_unassigned',
  'field_missing',
  'selected_channel_missing',
  'selected_channel_unavailable',
])
const formalizationSignatureStatusSchema = z.enum([
  'initialization_required',
  'locked',
  'preparing_configuration',
  'configuring',
  'ready_for_sending',
  'read_only',
])

function addDuplicateIssues<T>(
  values: readonly T[],
  getKey: (value: T) => string,
  addIssue: (issue: { code: 'custom'; message: string; path: number[] }) => void,
) {
  const seen = new Set<string>()

  values.forEach((value, index) => {
    const key = getKey(value)

    if (seen.has(key)) {
      addIssue({
        code: 'custom',
        message: 'Valores duplicados não são permitidos.',
        path: [index],
      })
      return
    }

    seen.add(key)
  })
}

const uniqueUuidArraySchema = z
  .array(uuidSchema)
  .max(MAX_ITEMS)
  .superRefine((values, context) => {
    addDuplicateIssues(
      values,
      (value) => value,
      (issue) => context.addIssue(issue),
    )
  })

const normalizedPositionSchema = z.number().finite().min(0).max(100)
const normalizedSizeSchema = z.number().finite().gt(0).max(100)

const signatureFieldShape = {
  fieldId: uuidSchema,
  signatoryId: uuidSchema,
  previewId: uuidSchema,
  type: signatureFieldTypeSchema,
  page: z.number().finite().int().min(1).max(MAX_PAGE),
  positionX: normalizedPositionSchema,
  positionY: normalizedPositionSchema,
  width: normalizedSizeSchema,
  height: normalizedSizeSchema,
}

const signatureFieldSchema = z
  .object(signatureFieldShape)
  .strict()
  .superRefine((field, context) => {
    if (field.positionX + field.width > 100) {
      context.addIssue({
        code: 'custom',
        message: 'O campo deve permanecer dentro da largura da página.',
        path: ['width'],
      })
    }

    if (field.positionY + field.height > 100) {
      context.addIssue({
        code: 'custom',
        message: 'O campo deve permanecer dentro da altura da página.',
        path: ['height'],
      })
    }
  })

const signatureFieldsSchema = z
  .array(signatureFieldSchema)
  .max(MAX_ITEMS)
  .superRefine((values, context) => {
    addDuplicateIssues(
      values,
      (value) => value.fieldId,
      (issue) => context.addIssue(issue),
    )
  })

const previewPageSchema = z
  .object({
    page: z.number().finite().int().min(1).max(MAX_PAGE),
    width: z.number().finite().gt(0).max(100_000),
    height: z.number().finite().gt(0).max(100_000),
  })
  .strict()

const previewPagesSchema = z
  .array(previewPageSchema)
  .max(MAX_PAGE)
  .superRefine((pages, context) => {
    pages.forEach((page, index) => {
      if (page.page !== index + 1) {
        context.addIssue({
          code: 'custom',
          message: 'As páginas devem ser contíguas e começar em um.',
          path: [index, 'page'],
        })
      }
    })
  })

const candidateSchema = z
  .object({
    collaboratorId: uuidSchema,
    name: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    profile: legalCollaboratorProfileSchema,
    email: z.string().trim().toLowerCase().pipe(z.email()),
    availableChannels: z
      .array(communicationChannelSchema)
      .max(Object.values(CommunicationChannel).length)
      .superRefine((values, context) => {
        addDuplicateIssues(
          values,
          (value) => value,
          (issue) => context.addIssue(issue),
        )
      }),
  })
  .strict()

const signatoryViewSchema = z
  .object({
    signatoryId: uuidSchema,
    personId: uuidSchema,
    role: signatoryRoleSchema,
    name: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    profile: legalCollaboratorProfileSchema.optional(),
    removable: z.boolean(),
    availableChannels: z
      .array(communicationChannelSchema)
      .max(Object.values(CommunicationChannel).length)
      .superRefine((values, context) => {
        addDuplicateIssues(
          values,
          (value) => value,
          (issue) => context.addIssue(issue),
        )
      }),
    selectedChannels: z
      .array(communicationChannelSchema)
      .max(Object.values(CommunicationChannel).length)
      .superRefine((values, context) => {
        addDuplicateIssues(
          values,
          (value) => value,
          (issue) => context.addIssue(issue),
        )
      }),
    documentIds: uniqueUuidArraySchema,
  })
  .strict()
  .superRefine((signatory, context) => {
    signatory.selectedChannels.forEach((channel, index) => {
      if (!signatory.availableChannels.includes(channel)) {
        context.addIssue({
          code: 'custom',
          message: 'O canal selecionado deve estar disponível.',
          path: ['selectedChannels', index],
        })
      }
    })
    if (!signatory.removable && signatory.role === 'additional_collaborator') {
      context.addIssue({
        code: 'custom',
        message: 'Signatários adicionais devem ser removíveis.',
        path: ['removable'],
      })
    }
  })

const previewViewSchema = z
  .object({
    previewId: uuidSchema,
    state: previewStateSchema,
    failureCode: previewFailureCodeSchema.optional(),
    pageCount: z.number().finite().int().min(1).max(MAX_PAGE).optional(),
    pages: previewPagesSchema,
  })
  .strict()
  .superRefine((preview, context) => {
    const hasPdf =
      preview.state === 'ready' ||
      preview.state === 'stale' ||
      preview.state === 'cleanup_pending'

    if (hasPdf && preview.pageCount === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Um preview disponível deve informar a quantidade de páginas.',
        path: ['pageCount'],
      })
    }

    if (!hasPdf && preview.pages.length > 0) {
      context.addIssue({
        code: 'custom',
        message: 'Previews ainda não disponíveis não podem expor páginas.',
        path: ['pages'],
      })
    }

    if (preview.pageCount !== undefined && preview.pages.length !== preview.pageCount) {
      context.addIssue({
        code: 'custom',
        message: 'A quantidade de páginas deve corresponder ao metadata do preview.',
        path: ['pages'],
      })
    }

    if (preview.state !== 'failed' && preview.failureCode !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'O código de falha só pode existir em um preview falho.',
        path: ['failureCode'],
      })
    }
  })

const documentViewSchema = z
  .object({
    documentId: uuidSchema,
    documentVersionId: uuidSchema,
    name: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    reviewStatus: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    preview: previewViewSchema.optional(),
    fields: signatureFieldsSchema,
  })
  .strict()

const readinessIssueSchema = z
  .object({
    path: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    code: readinessIssueCodeSchema,
  })
  .strict()

const readinessSchema = z
  .object({
    ready: z.boolean(),
    assignmentCount: z.number().finite().int().min(0).max(MAX_ITEMS),
    issues: z.array(readinessIssueSchema).max(MAX_ITEMS),
  })
  .strict()
  .superRefine((readiness, context) => {
    if (readiness.ready !== (readiness.issues.length === 0)) {
      context.addIssue({
        code: 'custom',
        message: 'A prontidão deve corresponder à ausência de problemas.',
        path: ['ready'],
      })
    }
  })

const previewPreparationSchema = z
  .object({
    total: z.number().finite().int().min(0).max(MAX_ITEMS),
    pending: z.number().finite().int().min(0).max(MAX_ITEMS),
    processing: z.number().finite().int().min(0).max(MAX_ITEMS),
    ready: z.number().finite().int().min(0).max(MAX_ITEMS),
    failed: z.number().finite().int().min(0).max(MAX_ITEMS),
  })
  .strict()
  .superRefine((preparation, context) => {
    const settledCount =
      preparation.pending +
      preparation.processing +
      preparation.ready +
      preparation.failed

    if (settledCount !== preparation.total) {
      context.addIssue({
        code: 'custom',
        message: 'Os estados de preparação devem somar o total.',
        path: ['total'],
      })
    }
  })

export const formalizationSignatureConfigurationSchema = z
  .object({
    formalizationId: uuidSchema,
    version: z.number().finite().int().min(0),
    editable: z.boolean(),
    status: formalizationSignatureStatusSchema,
    previewPreparation: previewPreparationSchema,
    signatories: z.array(signatoryViewSchema).max(MAX_ITEMS),
    documents: z.array(documentViewSchema).max(MAX_ITEMS),
    readiness: readinessSchema,
  })
  .strict()

export type FormalizationSignatureConfiguration = z.infer<
  typeof formalizationSignatureConfigurationSchema
>

export const formalizationSignatureCandidateSchema = candidateSchema
export type FormalizationSignatureCandidateResponse = z.infer<
  typeof formalizationSignatureCandidateSchema
>

export const formalizationSignatureCandidatePageSchema = z
  .object({
    items: z.array(candidateSchema).max(MAX_ITEMS),
    page: z.number().finite().int().min(1).max(MAX_PAGE),
    limit: z.number().finite().int().min(1).max(MAX_ITEMS),
    total: z.number().finite().int().min(0),
  })
  .strict()

export type FormalizationSignatureCandidatePage = z.infer<
  typeof formalizationSignatureCandidatePageSchema
>

export const listFormalizationSignatureCandidatesSchema = z
  .object({
    search: optionalSearchSchema,
    page: pageSchema,
    limit: limitSchema,
  })
  .strict()

export const formalizationSignatureCandidatesQuerySchema =
  listFormalizationSignatureCandidatesSchema

export type ListFormalizationSignatureCandidatesInput = z.infer<
  typeof listFormalizationSignatureCandidatesSchema
>
export type FormalizationSignatureCandidatesQuery =
  ListFormalizationSignatureCandidatesInput

export const initializeFormalizationSignatureConfigurationSchema = z
  .object({ expectedVersion: expectedVersionSchema })
  .strict()
export type InitializeFormalizationSignatureConfigurationInput = z.infer<
  typeof initializeFormalizationSignatureConfigurationSchema
>

export const addFormalizationSignatorySchema = z
  .object({ personId: uuidSchema, expectedVersion: expectedVersionSchema })
  .strict()
export type AddFormalizationSignatoryInput = z.infer<
  typeof addFormalizationSignatorySchema
>

export const removeFormalizationSignatorySchema = z
  .object({ expectedVersion: expectedVersionSchema })
  .strict()
export type RemoveFormalizationSignatoryInput = z.infer<
  typeof removeFormalizationSignatorySchema
>

export const replaceFormalizationSignatoryDocumentsSchema = z
  .object({ documentIds: uniqueUuidArraySchema, expectedVersion: expectedVersionSchema })
  .strict()
export type ReplaceFormalizationSignatoryDocumentsInput = z.infer<
  typeof replaceFormalizationSignatoryDocumentsSchema
>

export const selectFormalizationSignatoryChannelSchema = z
  .object({
    channel: communicationChannelSchema,
    selected: z.boolean().default(true),
    expectedVersion: expectedVersionSchema,
  })
  .strict()
export type SelectFormalizationSignatoryChannelInput = z.infer<
  typeof selectFormalizationSignatoryChannelSchema
>

export const requestFormalizationSignaturePreviewGenerationSchema = z
  .object({ expectedVersion: expectedVersionSchema })
  .strict()
export type RequestFormalizationSignaturePreviewGenerationInput = z.infer<
  typeof requestFormalizationSignaturePreviewGenerationSchema
>

export const replaceFormalizationSignatureFieldsSchema = z
  .object({
    previewId: uuidSchema,
    fields: signatureFieldsSchema,
    expectedVersion: expectedVersionSchema,
  })
  .strict()
export type ReplaceFormalizationSignatureFieldsInput = z.infer<
  typeof replaceFormalizationSignatureFieldsSchema
>

export const resetFormalizationSignatureConfigurationSchema = z
  .object({ expectedVersion: expectedVersionSchema })
  .strict()
export type ResetFormalizationSignatureConfigurationInput = z.infer<
  typeof resetFormalizationSignatureConfigurationSchema
>

export const reopenFormalizationDocumentPackageSchema = z
  .object({ expectedVersion: expectedVersionSchema })
  .strict()
export type ReopenFormalizationDocumentPackageInput = z.infer<
  typeof reopenFormalizationDocumentPackageSchema
>

export const formalizationSignatureFieldViewSchema = signatureFieldSchema
export const formalizationSignaturePreviewViewSchema = previewViewSchema
export const formalizationSignatureSignatoryViewSchema = signatoryViewSchema
export const formalizationSignatureDocumentViewSchema = documentViewSchema
export const formalizationSignatureReadinessSchema = readinessSchema
export const formalizationSignaturePreviewPreparationSchema = previewPreparationSchema

export type FormalizationSignatureFieldView = z.infer<
  typeof formalizationSignatureFieldViewSchema
>
export type FormalizationSignaturePreviewView = z.infer<
  typeof formalizationSignaturePreviewViewSchema
>
export type FormalizationSignatureSignatoryView = z.infer<
  typeof formalizationSignatureSignatoryViewSchema
>
export type FormalizationSignatureDocumentView = z.infer<
  typeof formalizationSignatureDocumentViewSchema
>
export type FormalizationSignatureReadiness = z.infer<
  typeof formalizationSignatureReadinessSchema
>
export type FormalizationSignaturePreviewPreparation = z.infer<
  typeof formalizationSignaturePreviewPreparationSchema
>

export type EligibleFormalizationSignatoryProfile = z.infer<
  typeof legalCollaboratorProfileSchema
>

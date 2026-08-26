import { test as base } from '@playwright/test'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

export const DOCUMENT_PRODUCTION_BACKEND = 'http://hms-api.test'
export const CONSULTATION_ID = 'consultation-1'
export const CONSULTATION_DOCUMENT_ID = 'document-1'
export const CONSULTATION_DOCUMENT_VERSION_ID = 'version-1'
export const FORMALIZATION_ID = 'formalization-1'
export const FORMALIZATION_DOCUMENT_ID = 'formalization-document-1'
export const FORMALIZATION_DOCUMENT_VERSION_ID = 'formalization-version-1'

const AUTHENTICATED_USER = {
  id: '6ecbc5b0-a145-4e0c-9167-31b54fb8318c',
  email: 'attendant@hms.test',
} as const

const AUTH_ACCESS_TOKEN =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiI2ZWNiYzViMC1hMTQ1LTRlMGYtOTE2Ny0zMWI1NGZiODMxOGMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjQxMDAwMDAwMDB9.signature'

type AuthFixture = {
  auth: typeof AUTHENTICATED_USER
}

const emptyContent = {
  type: 'doc',
  content: [{ type: 'paragraph', attrs: { textAlign: null } }],
} as unknown as DocumentTemplateContent

const documentSpecificationDetails = {
  documentSpecificationId: 'spec-1',
  name: 'Procuração',
  description: 'Documento de representação',
  application: { scope: 'global', moment: 'consultation' },
  isRequired: true,
  status: 'available',
  content: emptyContent,
  variables: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
}

type DocumentSpecificationDetails = typeof documentSpecificationDetails

type DocumentProductionState = {
  details: DocumentSpecificationDetails
  listRequests: number
  getRequests: number
  patchRequests: number
  templatePatchRequests: number
  createRequests: number
  consultation: ConsultationDocumentProductionState
}

type ConsultationDocumentVersionResponse = {
  id: string
  documentId: string
  fileId: string
  versionNumber: number
  source: 'ai' | 'manual'
  content: typeof emptyContent
  pendingMarkers: readonly { marker: string }[]
  createdByCollaboratorId: string
  createdAt: string
  status: 'in_review' | 'approved' | 'rejected'
  reviewedByCollaboratorId?: string
  reviewedAt?: string
  rejectionReason?: string
}

type ConsultationDocumentSummary = {
  id: string
  versionNumber: number
  source: 'ai' | 'manual'
  status: 'in_review' | 'approved' | 'rejected'
  pendingMarkersCount: number
  createdByCollaboratorId: string
  createdAt: string
  rejectionReason?: string
}

type ConsultationDocument = {
  id: string
  title: string
  currentVersionId?: string
  versions: ConsultationDocumentSummary[]
}

type ConsultationResponseOperation =
  | 'list'
  | 'version'
  | 'generation'
  | 'review'
  | 'current'

type ConsultationDocumentProductionState = {
  documents: ConsultationDocument[]
  versions: Record<string, ConsultationDocumentVersionResponse>
  listRequests: number
  versionRequests: number
  generationRequests: number
  batchGenerationRequests: number
  reviewRequests: number
  manualVersionRequests: number
  currentVersionRequests: number
  requests: Array<{ method: string; path: string; body: unknown }>
  failNext(operation: ConsultationResponseOperation, status: number): void
  responseOverrides: Partial<Record<ConsultationResponseOperation, number>>
}

type FormalizationState = {
  details: any
  documents: any[]
  selection: any
  versions: Record<string, any>
  requests: Array<{ method: string; path: string; body: unknown }>
  startRequests: number
  draftRequests: number
  closeRequests: number
  reopenRequests: number
  listRequests: number
  selectionGetRequests: number
  selectionPutRequests: number
  generationRequests: number
  reviewRequests: number
  confirmRequests: number
  closeWithoutContractRequests: number
}

export type DocumentProductionFixture = {
  documentProduction: DocumentProductionState & { formalization: FormalizationState }
}

function createFormalizationState(): FormalizationState {
  const details = {
    formalization: {
      id: FORMALIZATION_ID,
      intakeId: 'intake-1',
      clientId: 'client-1',
      consultationId: CONSULTATION_ID,
      assignedLawyerId: 'admin',
      status: 'in_progress',
      contractFormId: 'form-1',
      contractFormSnapshot: {
        dynamicFormId: 'form-1',
        name: 'Condições comerciais',
        fields: [
          {
            id: 'field-text',
            key: 'service',
            label: 'Serviço contratado',
            type: 'short_text',
            position: 1,
            required: true,
          },
          {
            id: 'field-value',
            key: 'value',
            label: 'Valor mensal',
            type: 'currency',
            position: 2,
            required: true,
          },
          {
            id: 'field-kind',
            key: 'kind',
            label: 'Modalidade',
            type: 'single_selection',
            position: 3,
            required: true,
            options: [
              { value: 'monthly', label: 'Mensal' },
              { value: 'fixed', label: 'Fixa' },
            ],
          },
        ],
      },
      contractFormAnswers: [],
      contractFormState: 'open',
      contractFormRevision: 0,
      version: 1,
    },
    intake: { id: 'intake-1', sequenceNumber: 339, version: 1 },
    consultation: {
      id: CONSULTATION_ID,
      primaryLegalQuestion: 'Como estruturar a contratação?',
      guidanceProvided: '',
      relevantFacts: [],
      potentialLegalRequests: [],
      identifiedRisks: [],
      suggestions: [],
    },
    client: {
      id: 'client-1',
      type: 'natural',
      name: 'Cliente HMS Teste',
      taxId: { type: 'cpf', value: '98198246304' },
      email: 'cliente@example.com',
      phone: '66840566416',
    },
    assignedLawyer: {
      id: 'admin',
      professionalName: 'Admin',
      jobTitle: 'Advogado',
      profile: 'admin',
      legalExpertises: [],
    },
  }
  return {
    details,
    documents: [
      {
        id: FORMALIZATION_DOCUMENT_ID,
        title: 'Contrato de prestação de serviços',
        isFresh: true,
        versions: [],
      },
    ],
    selection: {
      selectedDocumentSpecificationIds: ['spec-1'],
      options: [
        {
          documentSpecificationId: 'spec-1',
          name: 'Procuração',
          description: 'Documento de representação',
          application: { scope: 'global', moment: 'formalization' },
          status: 'available',
          selected: true,
          hasVersion: false,
        },
        {
          documentSpecificationId: 'spec-2',
          name: 'Aditivo contratual',
          description: 'Documento complementar',
          application: { scope: 'global', moment: 'formalization' },
          status: 'available',
          selected: false,
          hasVersion: false,
        },
      ],
    },
    versions: {},
    requests: [],
    startRequests: 0,
    draftRequests: 0,
    closeRequests: 0,
    reopenRequests: 0,
    listRequests: 0,
    selectionGetRequests: 0,
    selectionPutRequests: 0,
    generationRequests: 0,
    reviewRequests: 0,
    confirmRequests: 0,
    closeWithoutContractRequests: 0,
  }
}

function createConsultationVersion(
  overrides: Partial<ConsultationDocumentVersionResponse> = {},
): ConsultationDocumentVersionResponse {
  return {
    id: CONSULTATION_DOCUMENT_VERSION_ID,
    documentId: CONSULTATION_DOCUMENT_ID,
    fileId: 'file-1',
    versionNumber: 1,
    source: 'ai',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [{ type: 'text', text: 'Olá {client_name}' }],
        },
      ],
    } as unknown as typeof emptyContent,
    pendingMarkers: [{ marker: '{client_name}' }],
    createdByCollaboratorId: 'admin',
    createdAt: '2026-01-02T00:00:00.000Z',
    status: 'in_review',
    ...overrides,
  }
}

function createConsultationState(): ConsultationDocumentProductionState {
  const version = createConsultationVersion()

  return {
    documents: [
      {
        id: CONSULTATION_DOCUMENT_ID,
        title: 'Contrato de prestação de serviços',
        versions: [
          {
            id: version.id,
            versionNumber: version.versionNumber,
            source: version.source,
            status: version.status,
            pendingMarkersCount: version.pendingMarkers.length,
            createdByCollaboratorId: version.createdByCollaboratorId,
            createdAt: version.createdAt,
          },
        ],
      },
      {
        id: 'document-2',
        title: 'Procuração',
        versions: [],
      },
    ],
    versions: { [version.id]: version },
    listRequests: 0,
    versionRequests: 0,
    generationRequests: 0,
    batchGenerationRequests: 0,
    reviewRequests: 0,
    manualVersionRequests: 0,
    currentVersionRequests: 0,
    requests: [],
    responseOverrides: {},
    failNext(operation, status) {
      this.responseOverrides[operation] = status
    },
  }
}

function createConsultationError(status: number) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify({ message: `Mocked consultation response: ${status}` }),
  } as const
}

export const test = base.extend<AuthFixture & DocumentProductionFixture>({
  auth: [
    async ({ page }, use) => {
      const now = new Date().toISOString()

      await page.route(
        'http://supabase.test/auth/v1/token?grant_type=password',
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: AUTH_ACCESS_TOKEN,
              token_type: 'bearer',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
              refresh_token: 'playwright-refresh-token',
              user: {
                id: AUTHENTICATED_USER.id,
                aud: 'authenticated',
                role: 'authenticated',
                email: AUTHENTICATED_USER.email,
                email_confirmed_at: now,
                phone: '',
                app_metadata: { provider: 'email', providers: ['email'] },
                user_metadata: {},
                identities: [],
                created_at: now,
                updated_at: now,
              },
            }),
          })
        },
      )
      await page.route('http://hms-api.test/auth/complete-sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            collaboratorId: 'admin',
            professionalName: 'Admin',
            email: AUTHENTICATED_USER.email,
            profile: 'admin',
            status: 'active',
          }),
        })
      })
      await page.goto('/login')
      await page.getByLabel('Email:').fill(AUTHENTICATED_USER.email)
      await page.getByRole('textbox', { name: 'Senha' }).fill('playwright-password')
      await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
      await page.waitForURL('**/home')

      await use(AUTHENTICATED_USER)
    },
    { auto: true, scope: 'test' },
  ],
  documentProduction: async ({ page }, use) => {
    const formalization = createFormalizationState()
    const state: DocumentProductionState & { formalization: FormalizationState } = {
      details: structuredClone(documentSpecificationDetails),
      listRequests: 0,
      getRequests: 0,
      patchRequests: 0,
      templatePatchRequests: 0,
      createRequests: 0,
      consultation: createConsultationState(),
      formalization,
    }

    await page.route(`${DOCUMENT_PRODUCTION_BACKEND}/**`, async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const consultation = state.consultation

      function recordRequest(body: unknown = undefined) {
        consultation.requests.push({ method: request.method(), path: url.pathname, body })
      }

      function recordFormalizationRequest(body: unknown = undefined) {
        formalization.requests.push({
          method: request.method(),
          path: url.pathname,
          body,
        })
      }

      function consumeOverride(operation: ConsultationResponseOperation) {
        const status = consultation.responseOverrides[operation]
        delete consultation.responseOverrides[operation]
        return status
      }

      async function fulfillConsultationError(operation: ConsultationResponseOperation) {
        const status = consumeOverride(operation)
        if (!status) return false
        await route.fulfill(createConsultationError(status))
        return true
      }

      if (url.pathname === '/collaborators/me' && request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            collaboratorId: 'admin',
            professionalName: 'Admin',
            email: 'admin@hms.test',
            profile: 'admin',
            status: 'active',
          }),
        })
        return
      }

      if (
        url.pathname === `/formalizations/by-intake/intake-1/start` &&
        request.method() === 'POST'
      ) {
        formalization.startRequests += 1
        recordFormalizationRequest()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.details),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}` &&
        request.method() === 'GET'
      ) {
        recordFormalizationRequest()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.details),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}/contract-form/draft` &&
        request.method() === 'PATCH'
      ) {
        formalization.draftRequests += 1
        const body = request.postDataJSON() as { answers?: unknown[] }
        recordFormalizationRequest(body)
        formalization.details.formalization.contractFormAnswers = body.answers ?? []
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.details.formalization),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}/contract-form/close` &&
        request.method() === 'PATCH'
      ) {
        formalization.closeRequests += 1
        const body = request.postDataJSON() as { answers?: unknown[] }
        recordFormalizationRequest(body)
        formalization.details.formalization.contractFormAnswers = body.answers ?? []
        formalization.details.formalization.contractFormState = 'closed'
        formalization.details.formalization.contractFormRevision = 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.details.formalization),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}/contract-form/reopen` &&
        request.method() === 'PATCH'
      ) {
        formalization.reopenRequests += 1
        recordFormalizationRequest(request.postDataJSON())
        formalization.details.formalization.contractFormState = 'open'
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.details.formalization),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}/documents` &&
        request.method() === 'GET'
      ) {
        formalization.listRequests += 1
        recordFormalizationRequest()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.documents),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}/documents/selection` &&
        request.method() === 'GET'
      ) {
        formalization.selectionGetRequests += 1
        recordFormalizationRequest()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.selection),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}/documents/selection` &&
        request.method() === 'PUT'
      ) {
        const body = request.postDataJSON() as { documentSpecificationIds?: string[] }
        const selectedDocumentSpecificationIds = body.documentSpecificationIds ?? []
        formalization.selectionPutRequests += 1
        formalization.selection = {
          ...formalization.selection,
          selectedDocumentSpecificationIds,
          options: formalization.selection.options.map((option: any) => ({
            ...option,
            selected: selectedDocumentSpecificationIds.includes(
              option.documentSpecificationId,
            ),
          })),
        }
        recordFormalizationRequest(body)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.selection),
        })
        return
      }

      const formalizationGenerationPath = new RegExp(
        `^/formalizations/${FORMALIZATION_ID}/documents/([^/]+)/generations$`,
      ).exec(url.pathname)
      if (formalizationGenerationPath && request.method() === 'POST') {
        formalization.generationRequests += 1
        recordFormalizationRequest(request.postDataJSON())
        const documentId = formalizationGenerationPath[1]
        const version = {
          id: FORMALIZATION_DOCUMENT_VERSION_ID,
          documentId,
          fileId: 'formalization-file-1',
          versionNumber: 1,
          source: 'ai',
          content: {
            type: 'doc',
            content: [{ type: 'paragraph', attrs: { textAlign: null } }],
          },
          pendingMarkers: [],
          createdByCollaboratorId: 'admin',
          createdAt: '2026-01-03T00:00:00.000Z',
          status: 'in_review',
        }
        formalization.versions[version.id] = version
        const document = formalization.documents.find((item) => item.id === documentId)
        if (document && !document.versions.some((item: any) => item.id === version.id)) {
          document.versions.push({
            id: version.id,
            versionNumber: version.versionNumber,
            source: version.source,
            status: version.status,
            pendingMarkersCount: 0,
            createdByCollaboratorId: version.createdByCollaboratorId,
            createdAt: version.createdAt,
          })
        }
        if (document) Object.assign(document, { generationStatus: 'completed' })
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({
            documentGenerationId: 'generation-1',
            documentId,
          }),
        })
        return
      }

      const formalizationVersionPath = new RegExp(
        `^/formalizations/${FORMALIZATION_ID}/document-versions/([^/]+)$`,
      ).exec(url.pathname)
      if (formalizationVersionPath && request.method() === 'GET') {
        const version = formalization.versions[formalizationVersionPath[1]]
        await route.fulfill({
          status: version ? 200 : 404,
          contentType: 'application/json',
          body: JSON.stringify(version ?? { message: 'Version not found' }),
        })
        return
      }

      const formalizationReviewPath = new RegExp(
        `^/formalizations/${FORMALIZATION_ID}/document-versions/([^/]+)/review$`,
      ).exec(url.pathname)
      if (formalizationReviewPath && request.method() === 'PATCH') {
        const body = request.postDataJSON() as {
          status: 'approved' | 'rejected'
          rejectionReason?: string
        }
        const version = formalization.versions[formalizationReviewPath[1]]
        formalization.reviewRequests += 1
        recordFormalizationRequest(body)
        if (!version) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Version not found' }),
          })
          return
        }
        version.status = body.status
        version.rejectionReason = body.rejectionReason
        version.reviewedByCollaboratorId = 'admin'
        version.reviewedAt = '2026-01-04T00:00:00.000Z'
        const document = formalization.documents.find(
          (item) => item.id === version.documentId,
        )
        const summary = document?.versions.find((item: any) => item.id === version.id)
        if (summary) summary.status = version.status
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(version),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}/documents/confirm` &&
        request.method() === 'PATCH'
      ) {
        formalization.confirmRequests += 1
        recordFormalizationRequest(request.postDataJSON())
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.details.formalization),
        })
        return
      }

      if (
        url.pathname === `/formalizations/${FORMALIZATION_ID}/close-without-contract` &&
        request.method() === 'PATCH'
      ) {
        formalization.closeWithoutContractRequests += 1
        recordFormalizationRequest(request.postDataJSON())
        formalization.details.formalization.status = 'cancelled'
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formalization.details.formalization),
        })
        return
      }

      if (url.pathname === '/legal-catalog/areas' && request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'area-1', name: 'Trabalhista', active: true }]),
        })
        return
      }

      if (
        url.pathname === `/consultations/${CONSULTATION_ID}` &&
        request.method() === 'GET'
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: CONSULTATION_ID,
            status: 'pending',
            attendanceFinalizedAt: '2026-01-02T00:00:00.000Z',
            legalAreaId: 'area-1',
            legalTopicId: 'topic-1',
            intake: { status: 'consultation_scheduled' },
          }),
        })
        return
      }

      if (
        url.pathname === `/consultations/${CONSULTATION_ID}/documents` &&
        request.method() === 'GET'
      ) {
        recordRequest()
        if (await fulfillConsultationError('list')) return
        consultation.listRequests += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(consultation.documents),
        })
        return
      }

      if (
        url.pathname === `/consultations/${CONSULTATION_ID}/documents/selection` &&
        request.method() === 'GET'
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            selectedDocumentSpecificationIds: ['spec-1'],
            options: [],
            confirmedAt: undefined,
          }),
        })
        return
      }

      const versionPath = new RegExp(
        `^/consultations/${CONSULTATION_ID}/documents/([^/]+)/versions/([^/]+)$`,
      ).exec(url.pathname)
      if (versionPath && request.method() === 'GET') {
        recordRequest()
        if (await fulfillConsultationError('version')) return
        consultation.versionRequests += 1
        const version = consultation.versions[versionPath[2]]
        if (!version) {
          await route.fulfill(createConsultationError(404))
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(version),
        })
        return
      }

      const generationPath = new RegExp(
        `^/consultations/${CONSULTATION_ID}/documents/([^/]+)/generations$`,
      ).exec(url.pathname)
      if (generationPath && request.method() === 'POST') {
        recordRequest(request.postDataJSON())
        if (await fulfillConsultationError('generation')) return
        consultation.generationRequests += 1
        const document = consultation.documents.find(
          (item) => item.id === generationPath[1],
        )
        if (document && document.versions.length === 0) {
          const version = createConsultationVersion({
            id: 'version-2',
            documentId: document.id,
            versionNumber: 1,
            createdAt: '2026-01-03T00:00:00.000Z',
          })
          consultation.versions[version.id] = version
          document.versions.push({
            id: version.id,
            versionNumber: version.versionNumber,
            source: version.source,
            status: version.status,
            pendingMarkersCount: version.pendingMarkers.length,
            createdByCollaboratorId: version.createdByCollaboratorId,
            createdAt: version.createdAt,
          })
        }
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({
            documentGenerationId: 'generation-1',
            documentId: generationPath[1],
          }),
        })
        return
      }

      if (
        url.pathname === `/consultations/${CONSULTATION_ID}/document-generations/batch` &&
        request.method() === 'POST'
      ) {
        recordRequest(request.postDataJSON())
        if (await fulfillConsultationError('generation')) return
        consultation.batchGenerationRequests += 1
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify([
            { documentGenerationId: 'generation-batch-1', documentId: 'document-2' },
          ]),
        })
        return
      }

      const manualPath = new RegExp(
        `^/consultations/${CONSULTATION_ID}/documents/([^/]+)/versions/([^/]+)/manual$`,
      ).exec(url.pathname)
      if (manualPath && request.method() === 'POST') {
        const body = request.postDataJSON()
        recordRequest(body)
        if (await fulfillConsultationError('generation')) return
        consultation.manualVersionRequests += 1
        const document = consultation.documents.find((item) => item.id === manualPath[1])
        const sourceVersion = consultation.versions[manualPath[2]]
        const version = createConsultationVersion({
          id: 'version-manual-1',
          documentId: manualPath[1],
          versionNumber: (document?.versions.length ?? 0) + 1,
          source: 'manual',
          sourceDocumentVersionId: manualPath[2],
          content: (body as { content: typeof emptyContent }).content,
        } as Partial<ConsultationDocumentVersionResponse> & {
          sourceDocumentVersionId?: string
        })
        if (document && sourceVersion) {
          consultation.versions[version.id] = version
          document.versions.push({
            id: version.id,
            versionNumber: version.versionNumber,
            source: version.source,
            status: version.status,
            pendingMarkersCount: version.pendingMarkers.length,
            createdByCollaboratorId: version.createdByCollaboratorId,
            createdAt: version.createdAt,
          })
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(version),
        })
        return
      }

      const reviewPath = new RegExp(
        `^/consultations/${CONSULTATION_ID}/documents/([^/]+)/versions/([^/]+)/review$`,
      ).exec(url.pathname)
      if (reviewPath && request.method() === 'PATCH') {
        const body = request.postDataJSON() as {
          decision: 'approved' | 'rejected'
          rejectionReason?: string
        }
        recordRequest(body)
        if (await fulfillConsultationError('review')) return
        consultation.reviewRequests += 1
        const version = consultation.versions[reviewPath[2]]
        if (!version) {
          await route.fulfill(createConsultationError(404))
          return
        }
        version.status = body.decision
        version.rejectionReason = body.rejectionReason
        version.reviewedByCollaboratorId = 'admin'
        version.reviewedAt = '2026-01-04T00:00:00.000Z'
        const summary = consultation.documents
          .find((item) => item.id === reviewPath[1])
          ?.versions.find((item) => item.id === version.id)
        if (summary) {
          summary.status = version.status
          summary.rejectionReason = version.rejectionReason
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(version),
        })
        return
      }

      const currentPath = new RegExp(
        `^/consultations/${CONSULTATION_ID}/documents/([^/]+)/versions/([^/]+)/current$`,
      ).exec(url.pathname)
      if (currentPath && request.method() === 'PATCH') {
        recordRequest(request.postDataJSON())
        if (await fulfillConsultationError('current')) return
        consultation.currentVersionRequests += 1
        const document = consultation.documents.find((item) => item.id === currentPath[1])
        if (document) document.currentVersionId = currentPath[2]
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(document),
        })
        return
      }

      if (
        url.pathname === '/legal-catalog/areas/area-1/topics' &&
        request.method() === 'GET'
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'topic-1', legalAreaId: 'area-1', name: 'Contratos', active: true },
          ]),
        })
        return
      }

      if (url.pathname === '/document-specifications' && request.method() === 'GET') {
        state.listRequests += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [state.details],
            page: Number(url.searchParams.get('page') ?? 1),
            pageSize: Number(url.searchParams.get('pageSize') ?? 20),
            total: 1,
            totalPages: 1,
          }),
        })
        return
      }

      if (url.pathname === '/document-specifications' && request.method() === 'POST') {
        state.createRequests += 1
        const requestBody = request.postDataJSON() as Record<string, unknown>
        state.details = {
          ...state.details,
          documentSpecificationId: 'created-specification',
          name: String(requestBody.name),
          description: String(requestBody.description),
          application:
            requestBody.application as DocumentSpecificationDetails['application'],
          isRequired: Boolean(requestBody.isRequired),
          status: 'available',
          content: requestBody.content as DocumentSpecificationDetails['content'],
          variables: requestBody.variables as DocumentSpecificationDetails['variables'],
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(state.details),
        })
        return
      }

      if (
        url.pathname ===
          `/document-specifications/${state.details.documentSpecificationId}` &&
        request.method() === 'GET'
      ) {
        state.getRequests += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.details),
        })
        return
      }

      if (url.pathname.endsWith('/template') && request.method() === 'PATCH') {
        state.templatePatchRequests += 1
        state.details = { ...state.details, ...(request.postDataJSON() as object) }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.details),
        })
        return
      }

      if (url.pathname.endsWith('/configuration') && request.method() === 'PATCH') {
        state.patchRequests += 1
        state.details = { ...state.details, ...(request.postDataJSON() as object) }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.details),
        })
        return
      }

      await route.continue()
    })

    await use(state)
  },
})

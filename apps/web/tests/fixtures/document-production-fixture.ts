import { test as base } from '@playwright/test'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

export const DOCUMENT_PRODUCTION_BACKEND = 'http://hms-api.test'
export const CONSULTATION_ID = 'consultation-1'
export const CONSULTATION_DOCUMENT_ID = 'document-1'
export const CONSULTATION_DOCUMENT_VERSION_ID = 'version-1'

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

export type DocumentProductionFixture = {
  documentProduction: DocumentProductionState
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
    const state: DocumentProductionState = {
      details: structuredClone(documentSpecificationDetails),
      listRequests: 0,
      getRequests: 0,
      patchRequests: 0,
      templatePatchRequests: 0,
      createRequests: 0,
      consultation: createConsultationState(),
    }

    await page.route(`${DOCUMENT_PRODUCTION_BACKEND}/**`, async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const consultation = state.consultation

      function recordRequest(body: unknown = undefined) {
        consultation.requests.push({ method: request.method(), path: url.pathname, body })
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

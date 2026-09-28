import { describe, expect, it, vi } from 'vitest'
import type { RestClient } from '@hms/core/shared/interfaces'

import { CaseManagementService } from '../case-management-service'

describe('CaseManagementService', () => {
  it('generates a case portal link with upload permission', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)

    await service.grantCasePortalAccess('case-1', { canUpload: true })

    expect(restClient.post).toHaveBeenCalledWith('/cases/case-1/portal-access', {
      canUpload: true,
    })
  })

  it('homologates the legal case dossier', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)

    await service.homologateDossier('case-1')

    expect(restClient.patch).toHaveBeenCalledWith(
      '/cases/case-1/dossier-gate/homologation',
      {},
    )
  })

  it('maps checklist, pending, case, and portal operations to their REST contracts', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)
    const caseRequest = { title: 'Aposentadoria' } as never
    const pendingRequest = { reason: 'missing_document' } as never
    const checklistItemRequest = {
      templateItemKey: 'documento-complementar',
      title: 'Documento complementar',
    }
    const checklistTemplate = { name: 'Previdenciário', items: [] } as never
    const portalFormData = new FormData()

    await service.createLegalCase(caseRequest)
    await service.listCasePendings('case-1')
    await service.getPendingMessage('pending-1')
    await service.editPendingMessage('pending-1', {
      subject: 'Documento pendente',
      body: 'Envie o documento.',
    })
    await service.approvePendingMessage('pending-1')
    await service.createPending('case-1', pendingRequest)
    await service.addComplementaryChecklistItem('case-1', checklistItemRequest)
    await service.listCaseChecklist('case-1')
    await service.listCaseChecklist('case-1', 'client 1')
    await service.listChecklistTemplates()
    await service.listMyCases()
    await service.listMyCases('client 1')
    await service.replaceChecklistTemplate(checklistTemplate)
    await service.getLegalCaseDetails('case-1')
    await service.reviewChecklistGate('case-1', {
      decision: 'approved',
      remarks: undefined,
    } as never)
    await service.listPortalPendingChecklist('case-1', 'portal token')
    await service.uploadPortalDocument(
      'case-1',
      'checklist-1',
      'portal token',
      portalFormData,
    )

    expect(restClient.post).toHaveBeenCalledWith('/cases', caseRequest)
    expect(restClient.get).toHaveBeenCalledWith('/cases/case-1/pendencies')
    expect(restClient.get).toHaveBeenCalledWith('/cases/pendencies/pending-1/message')
    expect(restClient.patch).toHaveBeenCalledWith('/cases/pendencies/pending-1/message', {
      subject: 'Documento pendente',
      body: 'Envie o documento.',
    })
    expect(restClient.post).toHaveBeenCalledWith(
      '/cases/pendencies/pending-1/message/approve',
      {},
    )
    expect(restClient.post).toHaveBeenCalledWith(
      '/cases/case-1/pendencies',
      pendingRequest,
    )
    expect(restClient.post).toHaveBeenCalledWith(
      '/cases/case-1/checklist/items',
      checklistItemRequest,
    )
    expect(restClient.get).toHaveBeenCalledWith('/cases/case-1/checklist')
    expect(restClient.get).toHaveBeenCalledWith(
      '/cases/case-1/checklist?clientId=client%201',
    )
    expect(restClient.get).toHaveBeenCalledWith('/cases/checklist-templates')
    expect(restClient.get).toHaveBeenCalledWith('/cases/my')
    expect(restClient.get).toHaveBeenCalledWith('/cases/my?clientId=client%201')
    expect(restClient.put).toHaveBeenCalledWith(
      '/cases/checklist-templates',
      checklistTemplate,
    )
    expect(restClient.get).toHaveBeenCalledWith('/cases/case-1')
    expect(restClient.patch).toHaveBeenCalledWith('/cases/case-1/checklist-gate', {
      decision: 'approved',
      remarks: undefined,
    })
    expect(restClient.get).toHaveBeenCalledWith(
      '/cases/case-1/portal-pendencies?portalToken=portal+token',
    )
    expect(restClient.postFormData).toHaveBeenCalledWith(
      '/cases/case-1/portal-pendencies/checklist-1/upload?portalToken=portal+token',
      portalFormData,
    )
  })
})

function makeRestClient(): RestClient {
  return {
    get: vi.fn(),
    getFile: vi.fn(),
    post: vi.fn().mockResolvedValue({ body: {} }),
    postFormData: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    setBaseUrl: vi.fn(),
    setHeader: vi.fn(),
    setAuthorization: vi.fn(),
    setQueryParam: vi.fn(),
    clearQueryParams: vi.fn(),
  }
}

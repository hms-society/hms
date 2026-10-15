import { useQuery, useQueryClient } from '@tanstack/react-query'

import type { CaseManagementService } from '@hms/core/case-management/interfaces'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'

import { useCaseChecklist } from './hooks/use-case-checklist'

type LegalPageDataParams = {
  caseId: string
  collaboratorId?: string
  enabled: boolean
  isAdministrator: boolean
  caseManagementService: CaseManagementService
}

type CasePresentationData = {
  clientName?: string | null
  legalArea?: string | null
  title?: string | null
}

const DEFAULT_CASE_PRESENTATION = {
  title: 'Aposentadoria por Tempo de Contribuição',
  legalArea: 'Área jurídica do checklist',
  clientName: 'Antônio Carvalho',
}

export function useMyCasePageLegalData(params: LegalPageDataParams) {
  return createLegalPageData(
    useLegalCaseDetails(params),
    useLegalCaseList(params),
    useCaseChecklist({ caseId: params.caseId, enabled: params.enabled }),
    params.caseId,
  )
}

function createLegalPageData(
  {
    data: caseDetails,
    error: caseError,
    isLoading: isLoadingCase,
  }: ReturnType<typeof useLegalCaseDetails>,
  { data: cases }: ReturnType<typeof useLegalCaseList>,
  checklist: ReturnType<typeof useCaseChecklist>,
  caseId: string,
) {
  // Keep case metadata and checklist values in the page's consumer-facing model.
  return {
    caseDetails,
    caseError,
    isLoadingCase,
    ...getCasePresentation(caseDetails, getListedCase(cases, caseId)),
    ...checklist,
  }
}

function getListedCase(
  cases: ReturnType<typeof useLegalCaseList>['data'],
  caseId: string,
) {
  return cases?.find((item) => item.id === caseId)
}

function getCasePresentation(
  caseDetails: CasePresentationData | undefined,
  listedCase: CasePresentationData | undefined,
) {
  return {
    caseTitle: getPresentationValue('title', caseDetails, listedCase),
    caseLegalArea: getPresentationValue('legalArea', caseDetails, listedCase),
    caseClientName: getPresentationValue('clientName', caseDetails, listedCase),
  }
}

function getPresentationValue(
  field: keyof CasePresentationData,
  caseDetails: CasePresentationData | undefined,
  listedCase: CasePresentationData | undefined,
) {
  return caseDetails?.[field] ?? listedCase?.[field] ?? DEFAULT_CASE_PRESENTATION[field]
}

function useLegalCaseDetails(params: LegalPageDataParams) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['case-details', params.caseId, params.collaboratorId],
    queryFn: () => fetchLegalCaseDetails(params, queryClient),
    enabled: params.enabled,
  })
}

function useLegalCaseList(params: LegalPageDataParams) {
  return useQuery({
    queryKey: ['case-management', 'my-cases', params.collaboratorId],
    queryFn: () => fetchLegalCaseList(params.caseManagementService),
    enabled: params.enabled && !params.isAdministrator,
  })
}

async function fetchLegalCaseDetails(
  params: LegalPageDataParams,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  const response = await params.caseManagementService.getLegalCaseDetails(params.caseId)
  if (response.isFailure) {
    throwCaseDetailsError(response.statusCode, params.caseId, queryClient)
  }
  return response.body
}

function throwCaseDetailsError(
  statusCode: number,
  caseId: string,
  queryClient: ReturnType<typeof useQueryClient>,
): never {
  if (statusCode === HTTP_STATUS_CODE.forbidden) {
    void queryClient.removeQueries({ queryKey: ['case-details', caseId] })
  }
  throw new Error('Falha ao buscar detalhes do caso')
}

async function fetchLegalCaseList(service: CaseManagementService) {
  const response = await service.listMyCases()
  if (response.isFailure) response.throwError()
  return response.body
}

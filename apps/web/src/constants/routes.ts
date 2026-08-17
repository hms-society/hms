export const ROUTES = {
  root: '/',
  login: '/login',
  home: '/home',
  intakes: '/intakes',
  newIntake: '/intakes/novo',
  requestPasswordReset: '/pedir-redefinir-senha',
  resetPassword: '/redefinir-senha',
  invite: '/convite',
  attendant: '/atendimento',
  attendantConsultations: '/atendimento/consultas',
  lawyerSchedule: '/agenda',
  lawyer: '/advogado',
  lawyerConsultations: '/advogado/consultas',
  lawyerCommunication: '/advogado/comunicacao',
  clients: '/clientes',
  collaborators: '/colaboradores',
  documentBatch: '/lotes-documentos',
  documentInbox: '/caixa-de-documentos',
  documentAnalysis: '/caixa-de-documentos/$fileId',
  paralegalCases: '/casos',
  paralegalDocuments: '/documentos',
  paralegalTriage: '/triagem',
  paralegalCommunication: '/comunicacao',
  client: '/cliente',
  clientMyCases: '/cliente/meus-casos',
  clientMyCaseDetails: '/cliente/meus-casos/$caseId',
  clientMessages: '/cliente/mensagens',
  clientPrivacy: '/cliente/privacidade',
  documentSpecifications: '/modelos-de-documentos',
  newDocumentSpecification: '/modelos-de-documentos/novo',
  documentSpecification: '/modelos-de-documentos/$documentSpecificationId',
  consultationDocuments: '/consultas/$consultationId/documentos',
  consultationDocumentVersion:
    '/consultas/$consultationId/documentos/$documentId/versoes/$documentVersionId',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

export function buildConsultationDocumentsPath(consultationId: string): string {
  return ROUTES.consultationDocuments.replace('$consultationId', consultationId)
}

export function buildConsultationDocumentVersionPath(params: {
  consultationId: string
  documentId: string
  documentVersionId: string
}): string {
  return ROUTES.consultationDocumentVersion
    .replace('$consultationId', params.consultationId)
    .replace('$documentId', params.documentId)
    .replace('$documentVersionId', params.documentVersionId)
}

export const ROUTES = {
  root: '/',
  login: '/login',
  home: '/home',
  intakes: '/intakes',
  intakeDetails: '/intakes/$intakeId',
  newIntake: '/intakes/novo',
  requestPasswordReset: '/pedir-redefinir-senha',
  resetPassword: '/redefinir-senha',
  invite: '/convite',
  attendant: '/atendimento',
  attendantConsultations: '/atendimento/consultas',
  lawyerSchedule: '/agenda',
  lawyer: '/advogado',
  lawyerConsultations: '/advogado/consultas',
  consultation: '/consultas/$consultationId',
  lawyerCommunication: '/advogado/comunicacao',
  lawyerCases: '/advogado/meus-casos',
  lawyerCaseDetails: '/advogado/meus-casos/$caseId',
  clients: '/clientes',
  clientDetails: '/clientes/$clienteId',
  collaborators: '/colaboradores',
  documentBatch: '/lotes-documentos',
  documentViewer: '/lotes-documentos/$fileId',
  documentInbox: '/caixa-de-documentos',
  documentAnalysis: '/caixa-de-documentos/$fileId',
  paralegalCases: '/casos',
  paralegalDocuments: '/documentos',
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
  consultationAttendanceForm: '/consultas/$consultationId/ficha-atendimento',
  consultationDocumentVersion:
    '/consultas/$consultationId/documentos/$documentId/versoes/$documentVersionId',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

export function buildConsultationDocumentsPath(consultationId: string): string {
  return ROUTES.consultationDocuments.replace('$consultationId', consultationId)
}

export function buildConsultationPath(consultationId: string): string {
  return ROUTES.consultation.replace('$consultationId', consultationId)
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

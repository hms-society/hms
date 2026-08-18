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

  lawyer: '/advogado',
  lawyerConsultations: '/advogado/consultas',
  lawyerCommunication: '/advogado/comunicacao',
  lawyerCases: '/advogado/meus-casos',
  lawyerSchedule: '/agenda',

  clients: '/clientes',
  collaborators: '/colaboradores',

  documentSpecifications: '/modelos-de-documentos',
  newDocumentSpecification: '/modelos-de-documentos/novo',
  documentSpecification: '/modelos-de-documentos/$documentSpecificationId',

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
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

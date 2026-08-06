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
  clientMyCases: '/cliente/meus-casos',
  clientMyCaseDetails: '/cliente/meus-casos/$caseId',
  clientMessages: '/cliente/mensagens',
  clientPrivacy: '/cliente/privacidade',
  clients: '/clientes',
  collaborators: '/colaboradores',
  paralegalCases: '/casos',
  paralegalDocuments: '/documentos',
  paralegalTriage: '/triagem',
  paralegalCommunication: '/comunicacao',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

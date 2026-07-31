export const ROUTES = {
  root: '/',
  login: '/login',
  home: '/home',
  intakes: '/intakes',
  newIntake: '/intakes/novo',
  forgotPassword: '/forgot-password',
  resetPassword: '/redefinir-senha',
  attendant: '/atendimento',
  attendantDashboard: '/atendimento/dashboard',
  attendantConsultations: '/atendimento/consultas',
  lawyer: '/advogado',
  lawyerConsultations: '/advogado/consultas',
  clientMyCases: '/cliente/meus-casos',
  clientMyCaseDetails: '/cliente/meus-casos/$caseId',
  clientMessages: '/cliente/mensagens',
  clientPrivacy: '/cliente/privacidade',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

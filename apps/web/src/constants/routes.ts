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
  clients: '/clientes',
  collaborators: '/colaboradores',
  documentSpecifications: '/modelos-de-documentos',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

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
  lawyer: '/advogado',
  lawyerConsultations: '/advogado/consultas',
  collaborators: '/colaboradores',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

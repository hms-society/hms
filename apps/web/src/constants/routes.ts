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
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

export const ROUTES = {
  root: '/',
  signIn: '/sign-in',
  home: '/home',
  intakes: '/intakes',
  newIntake: '/intakes/new',
  consultations: '/consultations',
  schedule: '/schedule',
  cases: '/cases',
  settings: '/settings',
  schedules: '/schedules',
  collaborators: '/collaborators',
  clients: '/clients',
  thirdParties: '/third-parties',
  finance: '/finance',
  indicators: '/indicators',
  audit: '/audit',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]

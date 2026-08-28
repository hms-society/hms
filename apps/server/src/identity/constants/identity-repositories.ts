export const IDENTITY_REPOSITORIES = {
  clients: Symbol('IDENTITY_REPOSITORIES.clients'),
  clientList: Symbol('IDENTITY_REPOSITORIES.clientList'),
  intakeClients: Symbol('IDENTITY_REPOSITORIES.intakeClients'),
  intakeResponsibles: Symbol('IDENTITY_REPOSITORIES.intakeResponsibles'),
  clientConsents: Symbol('IDENTITY_REPOSITORIES.clientConsents'),
  users: Symbol('IDENTITY_REPOSITORIES.users'),
  collaborators: Symbol('IDENTITY_REPOSITORIES.collaborators'),
  registrationAttempts: Symbol('IDENTITY_REPOSITORIES.registrationAttempts'),
  transaction: Symbol('IDENTITY_REPOSITORIES.transaction'),
} as const

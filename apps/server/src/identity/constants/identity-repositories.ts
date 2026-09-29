export const IDENTITY_REPOSITORIES = {
  clients: Symbol('IDENTITY_REPOSITORIES.clients'),
  intakeClients: Symbol('IDENTITY_REPOSITORIES.intakeClients'),
  intakeResponsibles: Symbol('IDENTITY_REPOSITORIES.intakeResponsibles'),
  clientConsents: Symbol('IDENTITY_REPOSITORIES.clientConsents'),
  users: Symbol('IDENTITY_REPOSITORIES.users'),
  collaborators: Symbol('IDENTITY_REPOSITORIES.collaborators'),
  registrationAttempts: Symbol('IDENTITY_REPOSITORIES.registrationAttempts'),
  thirdParties: Symbol('IDENTITY_REPOSITORIES.thirdParties'),
  thirdPartyAuditLogs: Symbol('IDENTITY_REPOSITORIES.thirdPartyAuditLogs'),
  thirdPartyPermissions: Symbol('IDENTITY_REPOSITORIES.thirdPartyPermissions'),
  transaction: Symbol('IDENTITY_REPOSITORIES.transaction'),
} as const

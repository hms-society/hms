export const IDENTITY_REPOSITORIES = {
  clients: 'identity:clients-repository',
  clientConsents: 'identity:client-consents-repository',
  users: 'identity:users-repository',
  collaborators: Symbol('IDENTITY_REPOSITORIES.collaborators'),
  registrationAttempts: Symbol('IDENTITY_REPOSITORIES.registrationAttempts'),
  transaction: Symbol('IDENTITY_REPOSITORIES.transaction'),
} as const

import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { AuthSession, AuthUser } from '@hms/core/identity/domain/structures'

export type IdentityRequestContext = {
  readonly auth: AuthSession
  readonly user: AuthUser
  readonly collaborator?: CollaboratorSummary
}

export type IdentityRequest = {
  auth?: AuthSession
  user?: AuthUser
  collaborator?: CollaboratorSummary
  identity?: IdentityRequestContext
}

export type AuthenticatedIdentityRequest = IdentityRequest & {
  auth: AuthSession
  user: AuthUser
  identity: IdentityRequestContext
}

export type AuthorizedIdentityRequest = AuthenticatedIdentityRequest & {
  collaborator: CollaboratorSummary
  identity: IdentityRequestContext & { readonly collaborator: CollaboratorSummary }
}

import type {
  CasePortalAccessGrant,
  CasePortalAccessGrantCreation,
} from '../domain/entities'

export interface CasePortalAccessGrantsRepository {
  add(grant: CasePortalAccessGrantCreation): Promise<CasePortalAccessGrant>
  findActiveByTokenHashAndCase(
    tokenHash: string,
    caseId: string,
  ): Promise<CasePortalAccessGrant | undefined>
  revoke(grantId: string, caseId: string): Promise<CasePortalAccessGrant | undefined>
  removeAll(): Promise<void>
}

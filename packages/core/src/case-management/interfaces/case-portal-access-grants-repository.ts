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
  findActiveByTokenHash(tokenHash: string): Promise<CasePortalAccessGrant | undefined>
  findByCaseId(caseId: string): Promise<readonly CasePortalAccessGrant[]>
  revokeActiveByCaseAndThirdParty(caseId: string, thirdPartyId: string): Promise<void>
  revoke(grantId: string, caseId: string): Promise<CasePortalAccessGrant | undefined>
  removeAll(): Promise<void>
}

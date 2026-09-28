import { pgEnum } from 'drizzle-orm/pg-core'
import { CasePortalAccessGrantStatus } from '@hms/core/case-management/domain/structures'

export const casePortalAccessGrantStatusModel = pgEnum(
  'case_portal_access_grant_status',
  [CasePortalAccessGrantStatus.Active, CasePortalAccessGrantStatus.Revoked],
)

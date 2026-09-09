import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatoryRoleModel = pgEnum('formalization_signatory_role', [
  'client',
  'responsible_lawyer',
  'additional_collaborator',
])

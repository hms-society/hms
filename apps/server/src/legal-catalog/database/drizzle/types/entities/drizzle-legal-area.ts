import type { InferSelectModel } from 'drizzle-orm'

import { legalAreaModel } from '@/legal-catalog/database/drizzle/models'

export type DrizzleLegalArea = InferSelectModel<typeof legalAreaModel>

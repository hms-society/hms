import type { InferSelectModel } from 'drizzle-orm'

import { intakeModel } from '@/intake/database/drizzle/models'

export type DrizzleIntake = InferSelectModel<typeof intakeModel>

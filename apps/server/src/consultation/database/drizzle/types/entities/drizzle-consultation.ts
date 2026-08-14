import type { InferSelectModel } from 'drizzle-orm'

import type { consultationModel } from '@/consultation/database/drizzle/models'

export type DrizzleConsultation = InferSelectModel<typeof consultationModel>

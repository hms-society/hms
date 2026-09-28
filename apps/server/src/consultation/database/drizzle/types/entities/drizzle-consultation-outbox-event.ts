import type { InferSelectModel } from 'drizzle-orm'

import type { consultationOutboxEventModel } from '@/consultation/database/drizzle/models'

export type DrizzleConsultationOutboxEvent = InferSelectModel<
  typeof consultationOutboxEventModel
>

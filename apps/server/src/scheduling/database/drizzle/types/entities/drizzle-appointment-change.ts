import type { InferSelectModel } from 'drizzle-orm'

import type { appointmentChangeModel } from '@/scheduling/database/drizzle/models'

export type DrizzleAppointmentChange = InferSelectModel<typeof appointmentChangeModel>

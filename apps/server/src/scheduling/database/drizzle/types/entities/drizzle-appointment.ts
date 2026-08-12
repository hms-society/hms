import type { InferSelectModel } from 'drizzle-orm'

import type { appointmentModel } from '../../models'

export type DrizzleAppointment = InferSelectModel<typeof appointmentModel>

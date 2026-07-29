import type { Intake } from '@hms/core/intake/domain/entities'
import type { DrizzleIntake } from '@/intake/database/drizzle/types/entities/drizzle-intake'

export class DrizzleIntakeMapper {
  toDomain(drizzleIntake: DrizzleIntake): Intake {
    return {
      ...drizzleIntake,
      demandNotes: drizzleIntake.demandNotes ?? undefined,
      closureReason: drizzleIntake.closureReason ?? undefined,
      closureNotes: drizzleIntake.closureNotes ?? undefined,
      closedAt: drizzleIntake.closedAt ?? undefined,
    }
  }
}

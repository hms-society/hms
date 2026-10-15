import { Injectable } from '@nestjs/common'
import type { RescheduledAppointmentConsultationProvider } from '@hms/core/shared/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { and, eq } from 'drizzle-orm'

import { consultationModel } from '@/consultation/database/drizzle/models'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'

@Injectable()
export class DrizzleRescheduledAppointmentConsultationProvider
  implements RescheduledAppointmentConsultationProvider
{
  constructor(private readonly transactionContext: DatabaseTransactionContext) {}

  async syncLawyerForAppointment(appointmentId: string, lawyerId: string): Promise<void> {
    const executor = this.transactionContext.get()
    if (!executor) {
      throw new AppError(
        'Consultation lawyer changes require an active scheduling transaction.',
        'Consultation Transaction Required',
      )
    }

    const [consultation] = await executor
      .select({ id: consultationModel.id, status: consultationModel.status })
      .from(consultationModel)
      .where(eq(consultationModel.appointmentId, appointmentId))
      .for('update')

    if (!consultation) return
    if (consultation.status !== 'pending') {
      throw new AppError(
        'Only a pending Consultation can follow an appointment reschedule.',
        'Consultation Not Editable',
      )
    }

    const [updated] = await executor
      .update(consultationModel)
      .set({ assignedLawyerId: lawyerId, updatedAt: new Date() })
      .where(
        and(
          eq(consultationModel.id, consultation.id),
          eq(consultationModel.status, 'pending'),
        ),
      )
      .returning({ id: consultationModel.id })

    if (!updated) {
      throw new AppError(
        'The pending Consultation could not be updated for the new lawyer.',
        'Consultation Persistence Error',
      )
    }
  }
}

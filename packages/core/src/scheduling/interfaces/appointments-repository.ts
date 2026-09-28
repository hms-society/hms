import type { Appointment, AppointmentChange } from '../domain/entities'

type AppointmentFacetKind = 'client' | 'lawyer'

type AppointmentUpdate = {
  scheduleId?: string
  startsAt?: Date
  endsAt?: Date
  status?: 'scheduled' | 'cancelled'
  cancelledAt?: Date
  updatedAt: Date
}

type AppointmentFacetScope = {
  scheduleIds?: readonly string[]
  clientId?: string
  lawyerId?: string
}

export interface AppointmentsRepository {
  add(appointment: Appointment): Promise<Appointment>
  addMany(appointments: readonly Appointment[]): Promise<readonly Appointment[]>
  removeAll(): Promise<void>
  findByIntakeId(intakeId: string): Promise<Appointment | undefined>
  findById(id: string): Promise<Appointment | undefined>
  findByIdForUpdate(id: string): Promise<Appointment | undefined>
  findOverlapping(
    scheduleId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment | undefined>
  listOverlapping(
    startsAt: Date,
    endsAt: Date,
    scheduleIds: readonly string[],
    clientId?: string,
  ): Promise<readonly Appointment[]>
  listChanges(appointmentId: string): Promise<readonly AppointmentChange[]>
  addChange(change: AppointmentChange): Promise<AppointmentChange>
  replaceIfRevisionMatches(
    appointmentId: string,
    expectedRevision: Date,
    changes: AppointmentUpdate,
  ): Promise<Appointment | undefined>
  listDistinctFacetIds(
    kind: AppointmentFacetKind,
    scope: AppointmentFacetScope,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ ids: readonly string[]; nextCursor?: string }>
  filterFacetIdsInScope(
    kind: AppointmentFacetKind,
    scope: AppointmentFacetScope,
    candidates: readonly string[],
  ): Promise<readonly string[]>
}

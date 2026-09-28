import { describe, expect, it, vi } from 'vitest'
import type { Appointment, Schedule } from '@hms/core/scheduling/domain/entities'
import type {
  AppointmentsRepository,
  SchedulingDatabase,
  SchedulingDatabaseRepositories,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'

import { DrizzleAppointmentWriteTransactionProvider } from '@/scheduling/database/drizzle/repositories/drizzle-appointment-write-transaction-provider'

describe('appointment write transaction ordering', () => {
  it('locks the schedule before re-reading and locking the appointment', async () => {
    const order: string[] = []
    const appointment = {
      id: 'appointment-1',
      scheduleId: 'schedule-1',
      status: 'scheduled',
    } as Appointment
    const schedule = { id: appointment.scheduleId } as Schedule
    const findById = vi
      .fn<() => Promise<Appointment | undefined>>()
      .mockImplementation(async () => {
        order.push('appointment.findById')
        return appointment
      })
    const findByIdForUpdate = vi
      .fn<() => Promise<Appointment | undefined>>()
      .mockImplementation(async () => {
        order.push('appointment.findByIdForUpdate')
        return appointment
      })
    const findScheduleByIdForUpdate = vi
      .fn<() => Promise<Schedule | null>>()
      .mockImplementation(async () => {
        order.push('schedule.findByIdForUpdate')
        return schedule
      })
    const appointmentsRepository = {
      findById,
      findByIdForUpdate,
    } as unknown as AppointmentsRepository
    const schedulesRepository = {
      findByIdForUpdate: findScheduleByIdForUpdate,
    } as unknown as SchedulesRepository
    const scope = {
      appointmentsRepository,
      schedulesRepository,
    } as SchedulingDatabaseRepositories
    const database = {
      run: async <Result>(
        operation: (repositories: SchedulingDatabaseRepositories) => Promise<Result>,
      ) => operation(scope),
    } satisfies SchedulingDatabase
    const provider = new DrizzleAppointmentWriteTransactionProvider(database)
    const operation = vi.fn(async (lockedAppointment) => {
      order.push('operation')
      return lockedAppointment?.status
    })

    await expect(
      provider.runWithLockedAppointment(appointment.id, operation),
    ).resolves.toBe('scheduled')
    expect(order).toEqual([
      'appointment.findById',
      'schedule.findByIdForUpdate',
      'appointment.findByIdForUpdate',
      'operation',
    ])
  })

  it('preserves missing appointment semantics without taking a lock', async () => {
    const findById = vi
      .fn<() => Promise<Appointment | undefined>>()
      .mockResolvedValue(undefined)
    const findByIdForUpdate = vi.fn<() => Promise<Appointment | undefined>>()
    const findScheduleByIdForUpdate = vi.fn<() => Promise<Schedule | null>>()
    const database = {
      run: async <Result>(
        operation: (repositories: SchedulingDatabaseRepositories) => Promise<Result>,
      ) =>
        operation({
          appointmentsRepository: {
            findById,
            findByIdForUpdate,
          } as unknown as AppointmentsRepository,
          schedulesRepository: { findByIdForUpdate } as unknown as SchedulesRepository,
        }),
    } satisfies SchedulingDatabase
    const provider = new DrizzleAppointmentWriteTransactionProvider(database)
    const operation = vi.fn(async (lockedAppointment) => lockedAppointment)

    await expect(
      provider.runWithLockedAppointment('missing-appointment', operation),
    ).resolves.toBeUndefined()
    expect(operation).toHaveBeenCalledWith(undefined)
    expect(findByIdForUpdate).not.toHaveBeenCalled()
    expect(findScheduleByIdForUpdate).not.toHaveBeenCalled()
  })

  it('passes undefined when the appointment disappears after the schedule lock', async () => {
    const appointment = {
      id: 'appointment-1',
      scheduleId: 'schedule-1',
      status: 'scheduled',
    } as Appointment
    const findById = vi
      .fn<() => Promise<Appointment | undefined>>()
      .mockResolvedValue(appointment)
    const findByIdForUpdate = vi
      .fn<() => Promise<Appointment | undefined>>()
      .mockResolvedValue(undefined)
    const findScheduleByIdForUpdate = vi
      .fn<() => Promise<Schedule | null>>()
      .mockResolvedValue({ id: appointment.scheduleId } as Schedule)
    const database = {
      run: async <Result>(
        operation: (repositories: SchedulingDatabaseRepositories) => Promise<Result>,
      ) =>
        operation({
          appointmentsRepository: {
            findById,
            findByIdForUpdate,
          } as unknown as AppointmentsRepository,
          schedulesRepository: {
            findByIdForUpdate: findScheduleByIdForUpdate,
          } as unknown as SchedulesRepository,
        }),
    } satisfies SchedulingDatabase
    const provider = new DrizzleAppointmentWriteTransactionProvider(database)
    const operation = vi.fn(async (lockedAppointment) => lockedAppointment)

    await expect(
      provider.runWithLockedAppointment(appointment.id, operation),
    ).resolves.toBeUndefined()
    expect(operation).toHaveBeenCalledWith(undefined)
  })

  it('retries a schedule change before invoking the callback', async () => {
    const firstAppointment = {
      id: 'appointment-1',
      scheduleId: 'schedule-1',
      status: 'scheduled',
    } as Appointment
    const movedAppointment = {
      ...firstAppointment,
      scheduleId: 'schedule-2',
    }
    const firstScope = {
      appointmentsRepository: {
        findById: vi.fn().mockResolvedValue(firstAppointment),
        findByIdForUpdate: vi.fn().mockResolvedValue(movedAppointment),
      } as unknown as AppointmentsRepository,
      schedulesRepository: {
        findByIdForUpdate: vi
          .fn()
          .mockResolvedValue({ id: firstAppointment.scheduleId } as Schedule),
      } as unknown as SchedulesRepository,
    } as SchedulingDatabaseRepositories
    const secondAppointment = { ...firstAppointment, scheduleId: 'schedule-2' }
    const secondScope = {
      appointmentsRepository: {
        findById: vi.fn().mockResolvedValue(secondAppointment),
        findByIdForUpdate: vi.fn().mockResolvedValue(secondAppointment),
      } as unknown as AppointmentsRepository,
      schedulesRepository: {
        findByIdForUpdate: vi
          .fn()
          .mockResolvedValue({ id: secondAppointment.scheduleId } as Schedule),
      } as unknown as SchedulesRepository,
    } as SchedulingDatabaseRepositories
    let attempt = 0
    const database = {
      run: async <Result>(
        operation: (repositories: SchedulingDatabaseRepositories) => Promise<Result>,
      ) => {
        attempt += 1
        try {
          return await operation(attempt === 1 ? firstScope : secondScope)
        } catch (error) {
          if (
            attempt === 1 &&
            error instanceof Error &&
            'code' in error &&
            error.code === '40001'
          ) {
            return operation(secondScope)
          }
          throw error
        }
      },
    } satisfies SchedulingDatabase
    const provider = new DrizzleAppointmentWriteTransactionProvider(database)
    const operation = vi.fn(async (lockedAppointment) => lockedAppointment)

    await expect(
      provider.runWithLockedAppointment(firstAppointment.id, operation),
    ).resolves.toEqual({
      appointmentId: secondAppointment.id,
      status: secondAppointment.status,
    })
    expect(attempt).toBe(1)
    expect(operation).toHaveBeenCalledTimes(1)
  })
})

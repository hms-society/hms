import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import { UnauthorizedException } from '@nestjs/common'
import type { User, UserCreation } from '@hms/core/identity/domain/entities'
import {
  CollaboratorCreationFaker,
  UserFaker,
} from '@hms/core/identity/domain/entities/fakers'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type {
  ClientsRepository,
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import {
  AppointmentFaker,
  ScheduleFaker,
} from '@hms/core/scheduling/domain/entities/fakers'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import { vi, type Mock } from 'vitest'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthGuard } from '@/identity/guards'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { SchedulingModule } from '@/scheduling/scheduling.module'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class SchedulingModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    readonly broker: { publish: Mock },
    readonly schedulesRepository: CalendarSchedulesRepository,
    readonly appointmentsRepository: CalendarAppointmentsRepository,
    readonly clientsRepository: ClientsRepository,
    readonly intakesRepository: IntakesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
    private readonly authentication: { user?: AuthUser },
    private seedSequence = 0,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller?: Type<unknown>) {
    const authentication: { user?: AuthUser } = {}
    const broker = { publish: vi.fn() }
    const restFixture = await RestFixture.register(
      {
        imports: [SchedulingModule],
        controllers: controller ? [controller] : [],
      },
      (builder) =>
        builder.overrideGuard(AuthGuard).useValue({
          canActivate: (context: ExecutionContext) => {
            const request = context.switchToHttp().getRequest<{
              headers: { authorization?: string }
              user?: AuthUser
              auth?: { accessToken: string; user: AuthUser }
            }>()
            if (!authentication.user || !request.headers.authorization) {
              throw new UnauthorizedException('Authentication token is required')
            }
            request.user = authentication.user
            request.auth = {
              accessToken: 'fixture-access-token',
              user: authentication.user,
            }
            return true
          },
        }),
    )

    return new SchedulingModuleFixture(
      restFixture,
      broker,
      restFixture.get(SCHEDULING_REPOSITORIES.schedules),
      restFixture.get(SCHEDULING_REPOSITORIES.appointments),
      restFixture.get(IDENTITY_REPOSITORIES.clients),
      restFixture.get(INTAKE_REPOSITORIES.intakes),
      restFixture.get(IDENTITY_REPOSITORIES.users),
      restFixture.get(IDENTITY_REPOSITORIES.collaborators),
      restFixture.get(LEGAL_CATALOG_REPOSITORIES.areas),
      restFixture.get(LEGAL_CATALOG_REPOSITORIES.topics),
      authentication,
    )
  }

  async registerUser(overrides: Partial<UserCreation> = {}) {
    const draft = UserFaker.fake({ status: 'active', ...overrides })
    const [user] = await this.usersRepository.addMany([draft])
    if (!user) throw new Error('Test user was not created')
    return user
  }

  async registerAdmin() {
    return this.registerAdministrativeCollaborator('admin', 'Administrador de teste')
  }

  async registerAttendant() {
    return this.registerAdministrativeCollaborator('attendant', 'Atendente de teste')
  }

  private async registerAdministrativeCollaborator(
    profile: 'admin' | 'attendant',
    professionalName: string,
  ) {
    const user = await this.registerUser()
    const collaborator = await this.collaboratorsRepository.add(
      CollaboratorCreationFaker.administrative({
        userId: user.id,
        profile,
        professionalName,
      }),
    )
    if (!collaborator) throw new Error('Test administrator was not created')
    return { user, collaborator }
  }

  async registerLawyer() {
    const sequence = ++this.seedSequence
    const [area] = await this.legalAreasRepository.addMany([
      { name: `Direito Civil ${sequence}`, active: true },
    ])
    if (!area) throw new Error('Test legal area was not created')
    const [topic] = await this.legalTopicsRepository.addMany([
      { legalAreaId: area.id, name: `Locação residencial ${sequence}`, active: true },
    ])
    if (!topic) throw new Error('Test legal topic was not created')
    const user = await this.registerUser()
    const collaborator = await this.collaboratorsRepository.add(
      CollaboratorCreationFaker.legal({
        userId: user.id,
        professionalName: 'Advogado de calendário',
        legalExpertises: [{ legalAreaId: area.id, legalTopicIds: [topic.id] }],
      }),
    )
    if (!collaborator) throw new Error('Test lawyer was not created')
    return { user, collaborator, area, topic }
  }

  async seedAppointment(lawyerId: string, responsibleId: string) {
    const sequence = ++this.seedSequence
    const client = await this.clientsRepository.add({
      type: 'natural',
      name: `Cliente do calendário ${sequence}`,
      taxId: { type: 'cpf', value: sequence % 2 === 0 ? '11144477735' : '52998224725' },
      email: `cliente.calendario.${sequence}@example.com`,
    })
    if (!client) throw new Error('Test client was not created')
    const [area] = await this.legalAreasRepository.addMany([
      { name: `Direito Trabalhista ${sequence}`, active: true },
    ])
    if (!area) throw new Error('Test intake area was not created')
    const [topic] = await this.legalTopicsRepository.addMany([
      { legalAreaId: area.id, name: `Contratos ${sequence}`, active: true },
    ])
    if (!topic) throw new Error('Test intake topic was not created')
    const [intake] = await this.intakesRepository.addMany([
      {
        clientId: client.id,
        responsibleId,
        createdBy: responsibleId,
        updatedBy: responsibleId,
        origin: 'direct',
        contactChannel: 'email',
        legalAreaId: area.id,
        legalTopicId: topic.id,
        urgency: 'normal',
        status: 'consultation_scheduled',
      },
    ])
    if (!intake) throw new Error('Test intake was not created')

    const existingSchedule = await this.schedulesRepository.findByCollaboratorId(lawyerId)
    const createdSchedule =
      existingSchedule ??
      (
        await this.schedulesRepository.addMany([
          ScheduleFaker.fake({
            collaboratorId: lawyerId,
            timeZone: 'America/Sao_Paulo',
            weeklyAvailability: [
              { weekday: 'monday', timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }] },
              {
                weekday: 'tuesday',
                timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
              },
              {
                weekday: 'wednesday',
                timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
              },
              {
                weekday: 'thursday',
                timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
              },
              { weekday: 'friday', timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }] },
            ],
          }),
        ])
      )[0]
    if (!createdSchedule) throw new Error('Test schedule was not created')
    const appointment = AppointmentFaker.fake({
      intakeId: intake.id,
      scheduleId: createdSchedule.id,
      clientId: client.id,
      startsAt: new Date('2030-01-14T13:00:00.000Z'),
      endsAt: new Date('2030-01-14T13:45:00.000Z'),
    })
    const [createdAppointment] = await this.appointmentsRepository.addMany([appointment])
    return { client, intake, schedule: createdSchedule, appointment: createdAppointment }
  }

  authenticateAs(user: User) {
    this.authentication.user = { id: user.id, email: user.email }
    return 'Bearer fixture-access-token'
  }

  resetDatabase() {
    this.broker.publish.mockReset()
    this.seedSequence = 0
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }
}

import type { INestApplication, Type } from '@nestjs/common'
import type { User, UserCreation } from '@hms/core/identity/domain/entities'
import {
  CollaboratorCreationFaker,
  UserFaker,
} from '@hms/core/identity/domain/entities/fakers'
import type {
  ClientsRepository,
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type { Broker } from '@hms/core/shared/interfaces'
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
  SchedulingDatabase,
} from '@hms/core/scheduling/interfaces'
import { vi, type Mock } from 'vitest'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'
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
    readonly database: SchedulingDatabase,
    readonly clientsRepository: ClientsRepository,
    readonly intakesRepository: IntakesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
    private readonly authFixture: SupabaseAuthFixture,
    private readonly accessTokens: Map<string, string>,
    private readonly inngestFixture: InngestFixture,
    private seedSequence = 0,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller?: Type<unknown>) {
    const authFixture = await SupabaseAuthFixture.register()
    const accessTokens = new Map<string, string>()
    const inngestFixture = await InngestFixture.register({ createFunctions: () => [] })
    const realBroker = new InngestBroker(inngestFixture.client as InngestClient)
    const broker: Broker & { publish: Mock } = {
      publish: vi.fn((event: Parameters<Broker['publish']>[0]) =>
        realBroker.publish(event),
      ),
    }
    const restFixture = await RestFixture.register(
      {
        imports: [SchedulingModule],
        controllers: controller ? [controller] : [],
        providers: [{ provide: InngestBroker, useValue: broker }],
      },
      (builder) => authFixture.configure(builder),
    )

    return new SchedulingModuleFixture(
      restFixture,
      broker,
      restFixture.get(SCHEDULING_REPOSITORIES.schedules),
      restFixture.get(SCHEDULING_REPOSITORIES.appointments),
      restFixture.get(SCHEDULING_REPOSITORIES.database),
      restFixture.get(IDENTITY_REPOSITORIES.clients),
      restFixture.get(INTAKE_REPOSITORIES.intakes),
      restFixture.get(IDENTITY_REPOSITORIES.users),
      restFixture.get(IDENTITY_REPOSITORIES.collaborators),
      restFixture.get(LEGAL_CATALOG_REPOSITORIES.areas),
      restFixture.get(LEGAL_CATALOG_REPOSITORIES.topics),
      authFixture,
      accessTokens,
      inngestFixture,
    )
  }

  private async registerUser(overrides: Partial<UserCreation> = {}) {
    const auth = await this.authFixture.createSignedInUser(overrides.email)
    const draft = UserFaker.fake({
      status: 'active',
      ...overrides,
      id: auth.user.id,
      email: auth.user.email,
    })
    const [user] = await this.usersRepository.addMany([draft])
    if (!user) throw new Error('Test user was not created')
    this.accessTokens.set(user.id, auth.accessToken)
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
    const token = this.accessTokens.get(user.id)
    if (!token) throw new Error('No Auth session was registered for the test user')
    return `Bearer ${token}`
  }

  resetDatabase() {
    this.broker.publish.mockClear()
    this.seedSequence = 0
    return this.restFixture.resetDatabase()
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      try {
        await this.authFixture.close()
      } finally {
        await this.inngestFixture.close()
      }
    }
  }
}

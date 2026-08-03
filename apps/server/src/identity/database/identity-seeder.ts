import { Inject, Injectable, Optional } from '@nestjs/common'
import type {
  ClientCreation,
  CollaboratorCreation,
  UserCreation,
} from '@hms/core/identity/domain/entities'
import { ClientFaker } from '@hms/core/identity/domain/entities/fakers'
import type { LegalExpertise } from '@hms/core/identity/domain/structures'
import type {
  AuthAdministrationProvider,
  ClientsRepository,
  CollaboratorRegistrationAttemptsRepository,
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { AppError } from '@hms/core/shared/domain/errors'

type UserSeed = {
  email: string
  status: UserCreation['status']
}

const DEFAULT_CLIENTS: ClientCreation[] = [
  ClientFaker.fake({ email: 'client@hms.br', name: 'Cliente HMS Teste' }),
  ...ClientFaker.fakeMany(9),
].map(({ id, createdAt, updatedAt, ...client }) => client)

const DEFAULT_USERS: UserSeed[] = [
  {
    email: 'admin@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'attendant@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'lawyer@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'paralegal@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'client@hms.br',
    status: 'active',
  },
]

type AdministrativeCollaboratorCreation = Extract<
  CollaboratorCreation,
  { legalExpertises?: never }
>
type LegalCollaboratorSeed = {
  professionalName: string
  jobTitle?: string
  profile: 'lawyer' | 'paralegal'
}

const DEFAULT_ADMINISTRATOR: Omit<AdministrativeCollaboratorCreation, 'userId'> & {
  profile: 'admin'
} = {
  professionalName: 'Administrador de desenvolvimento',
  jobTitle: 'Administrador',
  profile: 'admin',
}

const DEFAULT_ATTENDANT: Omit<AdministrativeCollaboratorCreation, 'userId'> & {
  profile: 'attendant'
} = {
  professionalName: 'Atendente de desenvolvimento',
  jobTitle: 'Atendente',
  profile: 'attendant',
}

const DEFAULT_LAWYER: LegalCollaboratorSeed = {
  professionalName: 'Advogado de desenvolvimento',
  jobTitle: 'Advogado',
  profile: 'lawyer',
}

const DEFAULT_PARALEGAL: LegalCollaboratorSeed = {
  professionalName: 'Paralegal de desenvolvimento',
  jobTitle: 'Paralegal',
  profile: 'paralegal',
}

@Injectable()
export class IdentitySeeder {
  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.registrationAttempts)
    private readonly registrationAttemptsRepository: CollaboratorRegistrationAttemptsRepository,
    @Optional()
    @Inject(IDENTITY_PROVIDERS.authAdministration)
    private readonly authAdministrationProvider?: AuthAdministrationProvider,
  ) {}

  seed(clients: ClientCreation[] = DEFAULT_CLIENTS) {
    return this.clientsRepository.addMany(clients)
  }

  async clear(
    authAdministrationProvider: AuthAdministrationProvider | undefined = this
      .authAdministrationProvider,
  ) {
    if (!authAdministrationProvider) {
      throw new AppError('AuthAdministrationProvider is required to clear users')
    }

    const authCleanupResults = await Promise.allSettled(
      DEFAULT_USERS.map(async ({ email }) => {
        const authUser = await authAdministrationProvider.findUserByEmail(email)
        if (authUser) await authAdministrationProvider.removeUser(authUser.authUserId)
      }),
    )

    await this.clientsRepository.removeAll()
    await this.registrationAttemptsRepository.removeAll()
    await this.collaboratorsRepository.removeAll()
    await this.usersRepository.removeAll()

    const authCleanupFailure = authCleanupResults.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
    if (authCleanupFailure) throw authCleanupFailure.reason
  }

  async seedUsers(
    users: UserSeed[] = DEFAULT_USERS,
    authAdministrationProvider: AuthAdministrationProvider | undefined = this
      .authAdministrationProvider,
    password?: string,
  ) {
    if (!authAdministrationProvider) {
      throw new AppError('AuthAdministrationProvider is required to seed users')
    }
    if (!password) {
      throw new AppError('HMS_USER_SEED_PASSWORD is required to seed users')
    }

    const userCreations = await Promise.all(
      users.map(async (user): Promise<UserCreation> => {
        const authUser =
          (await authAdministrationProvider.findUserByEmail(user.email)) ??
          (await authAdministrationProvider.createUser(user.email, password))

        return {
          id: 'authUserId' in authUser ? authUser.authUserId : authUser.id,
          email: user.email,
          status: user.status,
        }
      }),
    )

    return this.usersRepository.addMany(userCreations)
  }

  async run(
    authAdministrationProvider: AuthAdministrationProvider | undefined = this
      .authAdministrationProvider,
    lawyerLegalExpertise?: LegalExpertise,
    seedPassword?: string,
  ) {
    if (!lawyerLegalExpertise) {
      throw new AppError('Default lawyer legal expertise is required')
    }

    const seededUsers = await this.seedUsers(
      DEFAULT_USERS,
      authAdministrationProvider,
      seedPassword,
    )
    const adminUser = seededUsers.find(
      ({ email }) => email === 'admin@hmsadvogados.com.br',
    )
    const attendantUser = seededUsers.find(
      ({ email }) => email === 'attendant@hmsadvogados.com.br',
    )
    const lawyerUser = seededUsers.find(
      ({ email }) => email === 'lawyer@hmsadvogados.com.br',
    )
    const paralegalUser = seededUsers.find(
      ({ email }) => email === 'paralegal@hmsadvogados.com.br',
    )
    const clientUser = seededUsers.find(({ email }) => email === 'client@hms.br')

    if (!adminUser || !attendantUser || !lawyerUser || !paralegalUser || !clientUser) {
      throw new AppError('Default seed users were not created')
    }

    const administrator = {
      userId: adminUser.id,
      ...DEFAULT_ADMINISTRATOR,
    } satisfies CollaboratorCreation

    const seededAdministrator = await this.collaboratorsRepository.add(administrator)

    const attendant = await this.collaboratorsRepository.add({
      userId: attendantUser.id,
      ...DEFAULT_ATTENDANT,
    })

    const lawyer = await this.collaboratorsRepository.add({
      userId: lawyerUser.id,
      ...DEFAULT_LAWYER,
      legalExpertises: [lawyerLegalExpertise],
    })

    if (!seededAdministrator || !attendant || !lawyer) {
      throw new AppError('Default seed collaborators were not created')
    }

    const clientsToSeed = DEFAULT_CLIENTS.map((client) => {
      if (client.email === 'client@hms.br') {
        return {
          ...client,
          id: clientUser.id,
        }
      }
      return client
    })

    const clients = await this.seed(clientsToSeed)

    return {
      clients,
      users: seededUsers,
      collaborators: [seededAdministrator, attendant, lawyer],
    }
  }
}

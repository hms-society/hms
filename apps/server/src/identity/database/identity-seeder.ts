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
  password?: string
  status: UserCreation['status']
}

const DEFAULT_CLIENTS: ClientCreation[] = [
  ClientFaker.fake({
    email: 'client@hms.br',
    name: 'Cliente HMS Teste',
    phone: '5511999999999',
  }),
  ClientFaker.fake({
    email: 'kauandominguesdesouza@gmail.com',
    name: 'Kauan Domingues de Souza',
    phone: '5519971659516',
  }),
  ClientFaker.fake({
    email: 'vinicius.lopes.machado@hms.test',
    name: 'Vinicius Lopes Machado',
    phone: '5512988442775',
    taxId: { type: 'cpf', value: '12345678909' },
  }),
  ...ClientFaker.fakeMany(8),
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
    email: 'ricardo.mendes@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'mariana.costa@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'paralegal@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'joao.pedro@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'beatriz.oliveira@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'client@hms.br',
    status: 'active',
  },
  {
    email: 'estagiario@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'gildarcio@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'samuel@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'sofia@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'gildarcio.attendant@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'gildarcio.admin@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'samuel.attendant@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'samuel.admin@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'sofia.attendant@hmsadvogados.com.br',
    status: 'active',
  },
  {
    email: 'sofia.admin@hmsadvogados.com.br',
    status: 'active',
  },
]

type AdministrativeCollaboratorCreation = Extract<
  CollaboratorCreation,
  { legalExpertises?: never }
>
type LegalCollaboratorSeed = {
  email: string
  professionalName: string
  jobTitle?: string
  profile: 'lawyer' | 'paralegal' | 'supervisor' | 'intern'
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

type AdministrativeCollaboratorSeed = Omit<
  AdministrativeCollaboratorCreation,
  'userId'
> & {
  email: string
}

const DEFAULT_PERSON_ADMINISTRATIVE_COLLABORATORS: AdministrativeCollaboratorSeed[] = [
  {
    email: 'gildarcio.attendant@hmsadvogados.com.br',
    professionalName: 'Gildárcio',
    jobTitle: 'Atendente',
    profile: 'attendant',
  },
  {
    email: 'gildarcio.admin@hmsadvogados.com.br',
    professionalName: 'Gildárcio',
    jobTitle: 'Administrador',
    profile: 'admin',
  },
  {
    email: 'samuel.attendant@hmsadvogados.com.br',
    professionalName: 'Samuel',
    jobTitle: 'Atendente',
    profile: 'attendant',
  },
  {
    email: 'samuel.admin@hmsadvogados.com.br',
    professionalName: 'Samuel',
    jobTitle: 'Administrador',
    profile: 'admin',
  },
  {
    email: 'sofia.attendant@hmsadvogados.com.br',
    professionalName: 'Sofia',
    jobTitle: 'Atendente',
    profile: 'attendant',
  },
  {
    email: 'sofia.admin@hmsadvogados.com.br',
    professionalName: 'Sofia',
    jobTitle: 'Administrador',
    profile: 'admin',
  },
]

const DEFAULT_LEGAL_COLLABORATORS: LegalCollaboratorSeed[] = [
  {
    email: 'lawyer@hmsadvogados.com.br',
    professionalName: 'Advogado de desenvolvimento',
    jobTitle: 'Advogado',
    profile: 'lawyer',
  },
  {
    email: 'ricardo.mendes@hmsadvogados.com.br',
    professionalName: 'Dr. Ricardo Mendes',
    jobTitle: 'Advogado Previdenciário',
    profile: 'lawyer',
  },
  {
    email: 'mariana.costa@hmsadvogados.com.br',
    professionalName: 'Mariana Costa',
    jobTitle: 'Advogada Auxiliar',
    profile: 'lawyer',
  },
  {
    email: 'paralegal@hmsadvogados.com.br',
    professionalName: 'Paralegal de desenvolvimento',
    jobTitle: 'Paralegal',
    profile: 'paralegal',
  },
  {
    email: 'joao.pedro@hmsadvogados.com.br',
    professionalName: 'João Pedro Silva',
    jobTitle: 'Paralegal',
    profile: 'paralegal',
  },
  {
    email: 'beatriz.oliveira@hmsadvogados.com.br',
    professionalName: 'Beatriz Oliveira',
    jobTitle: 'Supervisora Jurídica',
    profile: 'supervisor',
  },
  {
    email: 'estagiario@hmsadvogados.com.br',
    professionalName: 'Estagiário de Teste',
    jobTitle: 'Estagiário',
    profile: 'intern',
  },
  {
    email: 'gildarcio@hmsadvogados.com.br',
    professionalName: 'Gildárcio',
    jobTitle: 'Estagiário',
    profile: 'lawyer',
  },
  {
    email: 'samuel@hmsadvogados.com.br',
    professionalName: 'Samuel',
    jobTitle: 'Estagiário',
    profile: 'lawyer',
  },
  {
    email: 'sofia@hmsadvogados.com.br',
    professionalName: 'Sofia',
    jobTitle: 'Estagiário',
    profile: 'lawyer',
  },
]

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

    await authAdministrationProvider.removeAllUsers()

    await this.clientsRepository.removeAll()
    await this.registrationAttemptsRepository.removeAll()
    await this.collaboratorsRepository.removeAll()
    await this.usersRepository.removeAll()
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
    const clientUser = seededUsers.find(({ email }) => email === 'client@hms.br')
    if (!adminUser || !attendantUser || !clientUser) {
      throw new AppError('Default seed users were not created')
    }

    const administrator = {
      userId: adminUser.id,
      ...DEFAULT_ADMINISTRATOR,
    } satisfies CollaboratorCreation

    const administratorCreated = await this.collaboratorsRepository.add(administrator)

    const attendantCreated = await this.collaboratorsRepository.add({
      userId: attendantUser.id,
      ...DEFAULT_ATTENDANT,
    })

    const personAdministrativeCollaborators = await Promise.all(
      DEFAULT_PERSON_ADMINISTRATIVE_COLLABORATORS.map(
        async ({ email, ...collaborator }) => {
          const user = seededUsers.find((seededUser) => seededUser.email === email)

          if (!user) {
            throw new AppError(`Seed user for ${email} was not created`)
          }

          return this.collaboratorsRepository.add({
            userId: user.id,
            ...collaborator,
          })
        },
      ),
    )

    const legalCollaborators = await Promise.all(
      DEFAULT_LEGAL_COLLABORATORS.map(async ({ email, ...collaborator }) => {
        const user = seededUsers.find((seededUser) => seededUser.email === email)

        if (!user) {
          throw new AppError(`Seed user for ${email} was not created`)
        }

        return this.collaboratorsRepository.add({
          userId: user.id,
          ...collaborator,
          legalExpertises: [lawyerLegalExpertise],
        })
      }),
    )

    if (
      !administratorCreated ||
      !attendantCreated ||
      personAdministrativeCollaborators.includes(undefined) ||
      legalCollaborators.includes(undefined)
    ) {
      throw new AppError('Default seed collaborators were not created')
    }

    const clientsToSeed = DEFAULT_CLIENTS.map((client) =>
      client.email === 'client@hms.br'
        ? { ...client, id: clientUser.id }
        : client,
    )
    const clients = await this.seed(clientsToSeed)

    return {
      clients,
      collaborators: [
        administratorCreated,
        attendantCreated,
        ...personAdministrativeCollaborators,
        ...legalCollaborators,
      ].filter(
        (collaborator): collaborator is NonNullable<typeof collaborator> =>
          collaborator !== undefined,
      ),
      users: seededUsers,
    }
  }
}

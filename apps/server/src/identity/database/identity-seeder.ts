import { Inject, Injectable, Optional } from '@nestjs/common'
import type { ClientCreation, UserCreation } from '@hms/core/identity/domain/entities'
import { ClientFaker } from '@hms/core/identity/domain/entities/fakers'
import type {
  AuthProvider,
  ClientsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { AppError } from '@hms/core/shared/domain/errors'

type UserSeed = {
  email: string
  password: string
  status: UserCreation['status']
}

const DEFAULT_CLIENTS: ClientCreation[] = [
  ClientFaker.fake({ email: 'client@hms.br', name: 'Cliente HMS Teste' }),
  ...ClientFaker.fakeMany(9),
].map(({ id, createdAt, updatedAt, ...client }) => client)

const DEFAULT_USERS: UserSeed[] = [
  {
    email: 'atendente@hmsadvogados.com.br',
    password: '123456',
    status: 'active',
  },
  {
    email: 'client@hms.br',
    password: 'password123',
    status: 'active',
  },
]

@Injectable()
export class IdentitySeeder {
  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: UsersRepository,
    @Optional()
    @Inject(IDENTITY_PROVIDERS.auth)
    private readonly authProvider?: AuthProvider,
  ) {}

  seed(clients: ClientCreation[] = DEFAULT_CLIENTS) {
    return this.clientsRepository.addMany(clients)
  }

  async clear() {
    await this.clientsRepository.removeAll()
    await this.usersRepository.removeAll()
  }

  async seedUsers(
    users: UserSeed[] = DEFAULT_USERS,
    authProvider: AuthProvider | undefined = this.authProvider,
  ) {
    if (!authProvider) {
      throw new AppError('AuthProvider is required to seed users')
    }

    const userCreations = await Promise.all(
      users.map(async (user): Promise<UserCreation> => {
        const authUser = await authProvider.createUser({
          identifier: user.email,
          password: user.password,
        })

        return {
          id: authUser.id,
          email: user.email,
          status: user.status,
        }
      }),
    )

    await this.usersRepository.addMany(userCreations)
  }

  run(authProvider: AuthProvider | undefined = this.authProvider) {
    return Promise.all([this.seedUsers(DEFAULT_USERS, authProvider), this.seed()])
  }
}

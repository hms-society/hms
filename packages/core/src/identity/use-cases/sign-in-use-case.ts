import type { AuthProvider } from '../interfaces'

export class SignInUseCase {
  constructor(private readonly authProvider: AuthProvider) {}

  execute(credentials: Parameters<AuthProvider['signIn']>[0]) {
    return this.authProvider.signIn(credentials)
  }
}

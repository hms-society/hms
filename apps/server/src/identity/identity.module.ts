import { Module } from '@nestjs/common'
import { AuthController } from './rest/controllers/auth.controller'
import { AuthService } from './services/auth.service'
import { PasswordResetService } from './services/password-reset.service'
import { SessionTestController } from 'src/shared/rest/controllers/session-test.controller'

@Module({
  controllers: [AuthController, SessionTestController],
  providers: [AuthService, PasswordResetService],
  exports: [AuthService, PasswordResetService],
})
export class IdentityModule {}

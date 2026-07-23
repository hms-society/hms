import { Module } from "@nestjs/common";
import { AuthController } from "./rest/controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { PasswordResetService } from './services/password-reset.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService],
  exports: [AuthService, PasswordResetService]
})

export class IdentityModule{}

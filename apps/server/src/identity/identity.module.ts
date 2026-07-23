import { Module } from "@nestjs/common";
import { AuthController } from "./rest/controllers/auth.controller";
import { AuthService } from "./services/auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})

export class IdentityModule{}

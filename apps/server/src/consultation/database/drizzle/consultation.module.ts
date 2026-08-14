import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { IdentityModule } from '@/identity/identity.module'
import { DrizzleConsultationsRepository } from './repository/drizzle-consultations-repository'

import {
  CreateConsultationUseCase,
  RegisterNoShowUseCase,
  StartConsultationUseCase,
  CompleteConsultationUseCase,
  GetConsultationByIdUseCase,
} from '@hms/core/consultation/use-cases'

import { CreateConsultationController } from './rest/controllers/create-consultation.controller'
import { StartConsultationController } from './rest/controllers/start-consultation.controller'
import { CompleteConsultationController } from './rest/controllers/complete-consultation.controller'
import { RegisterNoShowController } from './rest/controllers/register-no-show.controller'
import { GetConsultationByIdController } from './rest/controllers/get-consultation-by-id.controller'

export const CONSULTATIONS_REPOSITORY = 'ConsultationsRepository'

@Module({
  imports: [
    IdentityModule,
  ],
  controllers: [
    CreateConsultationController,
    StartConsultationController,
    CompleteConsultationController,
    RegisterNoShowController,
    GetConsultationByIdController,
  ],
  providers: [
    DrizzleClient,
    DrizzleConsultationsRepository,
    {
      provide: CONSULTATIONS_REPOSITORY,
      useClass: DrizzleConsultationsRepository,
    },
    {
      provide: CreateConsultationUseCase,
      useFactory: (repo: DrizzleConsultationsRepository) =>
        new CreateConsultationUseCase(repo),
      inject: [CONSULTATIONS_REPOSITORY],
    },
    {
      provide: RegisterNoShowUseCase,
      useFactory: (repo: DrizzleConsultationsRepository) =>
        new RegisterNoShowUseCase(repo),
      inject: [CONSULTATIONS_REPOSITORY],
    },
    {
      provide: StartConsultationUseCase,
      useFactory: (repo: DrizzleConsultationsRepository) =>
        new StartConsultationUseCase(repo),
      inject: [CONSULTATIONS_REPOSITORY],
    },
    {
      provide: CompleteConsultationUseCase,
      useFactory: (repo: DrizzleConsultationsRepository) =>
        new CompleteConsultationUseCase(repo),
      inject: [CONSULTATIONS_REPOSITORY],
    },
    {
      provide: GetConsultationByIdUseCase,
      useFactory: (repo: DrizzleConsultationsRepository) =>
        new GetConsultationByIdUseCase(repo),
      inject: [CONSULTATIONS_REPOSITORY],
    },
  ],
  exports: [
    CONSULTATIONS_REPOSITORY,
    CreateConsultationUseCase,
    RegisterNoShowUseCase,
    StartConsultationUseCase,
    CompleteConsultationUseCase,
    GetConsultationByIdUseCase,
  ],
})
export class ConsultationModule {}
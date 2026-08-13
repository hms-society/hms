import { Module } from '@nestjs/common'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleConsultationsRepository } from './repository/drizzle-consultations-repository'
import {
  CreateConsultationUseCase,
  RegisterNoShowUseCase,
  StartConsultationUseCase,
  CompleteConsultationUseCase,
  GetConsultationByIdUseCase,
} from '@hms/core/consultation/use-cases'
import {
  CreateConsultationController,
  StartConsultationController,
  CompleteConsultationController,
  RegisterNoShowController,
  GetConsultationByIdController,
  UpdateClientQualificationController,
} from './rest/controllers'

export const CONSULTATIONS_REPOSITORY = 'ConsultationsRepository'

@Module({
  controllers: [
    CreateConsultationController,
    StartConsultationController,
    CompleteConsultationController,
    RegisterNoShowController,
    GetConsultationByIdController,
    UpdateClientQualificationController,
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
    CreateConsultationUseCase,
    RegisterNoShowUseCase,
    StartConsultationUseCase,
    CompleteConsultationUseCase,
    GetConsultationByIdUseCase,
  ],
})
export class ConsultationModule {}

import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleConsultationsRepository } from './repository/drizzle-consultations-repository'
import {
  CreateConsultationUseCase,
  RegisterNoShowUseCase,
  StartConsultationUseCase,
  CompleteConsultationUseCase,
} from '@hms/core/consultation/use-cases'

export const CONSULTATIONS_REPOSITORY = 'ConsultationsRepository'

@Module({
  providers: [
    DrizzleClient,
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
  ],
  exports: [
    CreateConsultationUseCase,
    RegisterNoShowUseCase,
    StartConsultationUseCase,
    CompleteConsultationUseCase,
  ],
})
export class ConsultationModule {}
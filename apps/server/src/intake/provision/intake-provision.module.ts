import { Module } from '@nestjs/common'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { INTAKE_PROVIDERS } from '@/intake/constants/intake-providers'
import { IntakeContractingProvider } from '@/intake/provision/intake-contracting-provider'

@Module({
  imports: [IntakeDatabaseModule],
  providers: [
    IntakeContractingProvider,
    {
      provide: INTAKE_PROVIDERS.contractingService,
      useExisting: IntakeContractingProvider,
    },
  ],
  exports: [INTAKE_PROVIDERS.contractingService],
})
export class IntakeProvisionModule {}

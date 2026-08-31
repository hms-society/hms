import { ApiPropertyOptional } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import { updateClientSchema } from '@hms/validation/identity'

class AddressDto {
  @ApiPropertyOptional()
  street!: string

  @ApiPropertyOptional()
  number!: string

  @ApiPropertyOptional()
  complement?: string

  @ApiPropertyOptional()
  district!: string

  @ApiPropertyOptional()
  city!: string

  @ApiPropertyOptional()
  state!: string

  @ApiPropertyOptional()
  zipCode!: string
}

class TaxIdDto {
  @ApiPropertyOptional({ enum: ['cpf', 'cnpj'] })
  type!: 'cpf' | 'cnpj'

  @ApiPropertyOptional()
  value!: string
}

export class UpdateClientRequestDto extends createZodDto(updateClientSchema) {
  @ApiPropertyOptional({ enum: ['natural', 'legal'] })
  type?: 'natural' | 'legal'

  @ApiPropertyOptional()
  name?: string

  @ApiPropertyOptional()
  legalName?: string

  @ApiPropertyOptional()
  tradeName?: string

  @ApiPropertyOptional({ type: () => TaxIdDto })
  taxId?: TaxIdDto

  @ApiPropertyOptional()
  email?: string

  @ApiPropertyOptional()
  phone?: string

  @ApiPropertyOptional({ type: () => AddressDto })
  address?: AddressDto

  @ApiPropertyOptional({ description: 'Justificativa para override de documento duplicado (apenas para Admin/Supervisor)' })
  duplicityOverrideJustification?: string
}

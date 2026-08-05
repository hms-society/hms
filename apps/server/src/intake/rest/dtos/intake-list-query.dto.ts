import { ApiPropertyOptional } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()

const optionalNumber = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined

  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}, z.number().optional())

export const intakeListQuerySchema = z.object({
  search: optionalText,
  status: optionalText,
  responsibleId: optionalText,
  origin: optionalText,
  contactChannel: optionalText,
  registeredFrom: optionalText,
  registeredTo: optionalText,
  page: optionalNumber,
  pageSize: optionalNumber,
})

export class IntakeListQueryDto extends createZodDto(intakeListQuerySchema) {
  @ApiPropertyOptional({ type: String })
  search?: string

  @ApiPropertyOptional({ type: String })
  status?: string

  @ApiPropertyOptional({ type: String })
  responsibleId?: string

  @ApiPropertyOptional({ type: String })
  origin?: string

  @ApiPropertyOptional({ type: String })
  contactChannel?: string

  @ApiPropertyOptional({ type: String, example: '2026-08-01' })
  registeredFrom?: string

  @ApiPropertyOptional({ type: String, example: '2026-08-31' })
  registeredTo?: string

  @ApiPropertyOptional({ type: Number, example: 1, default: 1 })
  page?: number

  @ApiPropertyOptional({ type: Number, example: 20, default: 20, maximum: 100 })
  pageSize?: number
}

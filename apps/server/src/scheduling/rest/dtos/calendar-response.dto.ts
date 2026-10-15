import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type {
  AppointmentDetails,
  CalendarEvent,
} from '@hms/core/scheduling/domain/structures'

export class CalendarResponseDto {
  @ApiProperty({ enum: ['appointment', 'block'] }) readonly kind!: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly appointmentId?: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly blockedPeriodId?: string
  @ApiProperty({ format: 'uuid' }) readonly scheduleId!: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly clientId?: string
  @ApiPropertyOptional() readonly clientName?: string
  @ApiProperty({ format: 'uuid' }) readonly lawyerId!: string
  @ApiProperty() readonly lawyerName!: string
  @ApiPropertyOptional() readonly startsAt?: Date
  @ApiPropertyOptional() readonly endsAt?: Date
  @ApiPropertyOptional() readonly startsOn?: string
  @ApiPropertyOptional() readonly endsOn?: string
  @ApiProperty() readonly timeZone!: string
  @ApiPropertyOptional() readonly status?: string
  @ApiPropertyOptional() readonly cancelledAt?: Date
  @ApiPropertyOptional({ format: 'uuid' }) readonly consultationId?: string
  @ApiPropertyOptional() readonly consultationStatus?: string
  @ApiPropertyOptional() readonly consultationStartedAt?: Date
  @ApiPropertyOptional() readonly updatedAt?: Date
  @ApiPropertyOptional() readonly reason?: string

  static fromDomain(input: CalendarEvent): CalendarResponseDto {
    return input as unknown as CalendarResponseDto
  }
}

export class AppointmentDetailsResponseDto extends CalendarResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  readonly changes!: AppointmentDetails['changes']

  static fromDomain(input: AppointmentDetails): AppointmentDetailsResponseDto {
    return input as unknown as AppointmentDetailsResponseDto
  }
}

export class CalendarFilterOptionsResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  readonly items!: readonly { id: string; name: string }[]
  @ApiPropertyOptional() readonly nextCursor?: string
}

export class RescheduleSlotResponseDto {
  @ApiProperty() readonly startsAt!: Date
  @ApiProperty() readonly endsAt!: Date
  @ApiProperty() readonly timeZone!: string
}

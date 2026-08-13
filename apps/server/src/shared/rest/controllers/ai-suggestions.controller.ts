import { Controller, Get, Post, Query, Param, Body, Inject, HttpStatus } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetAiSuggestionsUseCase,
  RegisterAiFeedbackUseCase,
} from '@hms/core/shared/use-cases'
import type {
  AiSuggestionsRepository,
  DatetimeProvider,
} from '@hms/core/shared/interfaces'
import { AI_SUGGESTIONS_REPOSITORIES } from '@/shared/constants/ai-suggestions-repositories'
import { DatetimeProvider as ConcreteDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

export class RegisterAiFeedbackDto {
  action: 'accept' | 'adjust' | 'reject' | 'block'
  adjustedContent?: string
  rejectionReason?: string
  collaboratorId?: string
}

@ApiTags('ai-suggestions')
@Controller('ai-suggestions')
export class AiSuggestionsController {
  private readonly getUseCase: GetAiSuggestionsUseCase
  private readonly feedbackUseCase: RegisterAiFeedbackUseCase

  constructor(
    @Inject(AI_SUGGESTIONS_REPOSITORIES.aiSuggestions)
    repository: AiSuggestionsRepository,
    @Inject(ConcreteDatetimeProvider)
    datetimeProvider: DatetimeProvider,
  ) {
    this.getUseCase = new GetAiSuggestionsUseCase(repository)
    this.feedbackUseCase = new RegisterAiFeedbackUseCase(repository, datetimeProvider)
  }

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sugestões de IA recuperadas com sucesso.',
  })
  async getSuggestions(@Query('entityId') entityId: string) {
    if (!entityId) {
      return []
    }
    return this.getUseCase.execute({ entityId })
  }

  @Post(':id/feedback')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback registrado com sucesso.',
  })
  async registerFeedback(
    @Param('id') id: string,
    @Body() dto: RegisterAiFeedbackDto,
  ) {
    return this.feedbackUseCase.execute({
      suggestionId: id,
      action: dto.action,
      adjustedContent: dto.adjustedContent,
      rejectionReason: dto.rejectionReason,
      collaboratorId: dto.collaboratorId ?? 'system-user',
    })
  }
}

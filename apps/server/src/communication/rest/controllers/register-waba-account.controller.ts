import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  Req,
  HttpStatus,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { AuthGuard } from '@/identity/guards'
import { RegisterWabaAccountDto } from '../dtos/register-waba-account.dto'
import { RegisterWabaAccountUseCase } from '@hms/core/communication/use-cases'
import type { UsersRepository, CollaboratorsRepository } from '@hms/core/identity/interfaces'

@Controller('communication/waba')
@UseGuards(AuthGuard)
export class RegisterWabaAccountController {
  constructor(
    private readonly registerWabaAccountUseCase: RegisterWabaAccountUseCase,
    @Inject('USERS_REPOSITORY')
    private readonly usersRepository: UsersRepository,
    @Inject('COLLABORATORS_REPOSITORY')
    private readonly collaboratorsRepository: CollaboratorsRepository,
  ) {}

  @Post('embedded-signup/exchange')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'WhatsApp WABA account registered successfully.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Administrator profile can perform WABA onboarding.',
  })
  @UsePipes(ZodValidationPipe)
  async handle(@Body() body: RegisterWabaAccountDto, @Req() req: any) {
    const user = await this.usersRepository.findById(req.user.id)
    if (!user || user.status !== 'active') {
      throw new ForbiddenException('User is inactive or unauthorized.')
    }

    const collaborator = await this.collaboratorsRepository.findByUserId(user.id)
    if (!collaborator || collaborator.profile !== 'admin') {
      throw new ForbiddenException('Apenas Administradores podem registrar números WABA.')
    }

    const channel = await this.registerWabaAccountUseCase.execute({
      lawyerId: body.lawyerId,
      code: body.code,
      wabaId: body.wabaId,
      phoneNumberId: body.phoneNumberId,
    })

    return {
      id: channel.id,
      wabaAccountId: channel.wabaAccountId,
      phoneNumberId: channel.phoneNumberId,
      displayPhoneNumber: channel.displayPhoneNumber,
      verifiedName: channel.verifiedName,
      qualityRating: channel.qualityRating,
      assignedLawyerId: channel.assignedLawyerId,
      status: channel.status,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    }
  }
}

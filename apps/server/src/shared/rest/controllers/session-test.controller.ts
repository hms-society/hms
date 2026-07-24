import { Controller, Get, UseGuards, Req } from '@nestjs/common'
import { SingleSessionGuard } from 'src/identity/guards/single-session.guard'

@Controller('session-test')
export class SessionTestController {
  @Get()
  @UseGuards(SingleSessionGuard)
  testar(@Req() request: any) {
    return {
      message: 'sessão válida',
      user: request.user,
    }
  }
}
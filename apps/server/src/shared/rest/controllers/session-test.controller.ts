import { Controller, Get, UseGuards, Req } from '@nestjs/common'
import { SingleSessionGuard } from 'src/identity/guards/single-session.guard'
import { InactivitySessionGuard } from 'src/identity/guards/inactivity-session.guard'

@Controller('session-test')
export class SessionTestController {
  @Get()
  @UseGuards(SingleSessionGuard, InactivitySessionGuard)
  testar(@Req() request: any) {
    return {
      message: 'sessão válida e ativa',
      user: request.user,
      timestamp: new Date(),
    }
  }
}

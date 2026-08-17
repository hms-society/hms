import { All, Controller, Inject, Req, Res } from '@nestjs/common'
import { serve } from 'inngest/express'
import type { Request, Response } from 'express'

import {
  INNGEST_OPTIONS,
  type InngestOptions,
} from '@/shared/messaging/inngest/inngest-options'

@Controller('api/inngest')
export class InngestController {
  constructor(
    @Inject(INNGEST_OPTIONS)
    private readonly inngestOptions: InngestOptions,
  ) {}

  @All()
  handleInngest(@Req() request: Request, @Res() response: Response) {
    const handler = serve(this.inngestOptions)
    return handler(request, response)
  }
}

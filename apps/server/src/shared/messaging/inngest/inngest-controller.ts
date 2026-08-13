import { All, Controller, Req, Res } from '@nestjs/common'
import { serve } from 'inngest/express'
import type { Request, Response } from 'express'

import { InngestService } from '@/shared/provision/inngest/inngest.service'

@Controller('api/inngest')
export class InngestController {
  constructor(private readonly inngestService: InngestService) {}

  @All()
  handleInngest(@Req() request: Request, @Res() response: Response) {
    const handler = serve({
      client: this.inngestService.client,
      functions: this.inngestService.getFunctions(),
    })

    return handler(request, response)
  }
}

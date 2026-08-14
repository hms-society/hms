import { Controller, Req, Res, All } from '@nestjs/common'
import { serve } from 'inngest/express'
import type { Request, Response } from 'express'
import { InngestService } from './inngest.service'

@Controller('api/inngest')
export class InngestController {
  constructor(private readonly inngestService: InngestService) {}

  @All()
  async handleInngest(@Req() req: Request, @Res() res: Response) {
    const handler = serve({
      client: this.inngestService.client,
      functions: this.inngestService.getFunctions(),
    })
    return handler(req, res)
  }
}

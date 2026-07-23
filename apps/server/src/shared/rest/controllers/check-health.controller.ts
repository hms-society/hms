import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Controller, Get } from '@nestjs/common'

const { version } = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
) as { version: string }

@Controller()
export class CheckHealthController {
  @Get('/health')
  handle() {
    return {
      version,
      timestamp: new Date().toISOString(),
      services: {
        database: 'UP',
        supabase: 'UP',
      },
    }
  }
}

import { HttpAdapterHost, NestFactory } from '@nestjs/core'

import { AppModule } from '@/app.module'
import { GlobalErrorHandler } from '@/shared/rest/filters'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // biome-ignore lint/correctness/useHookAtTopLevel: Nest global filter registration is not a React hook.
  app.useGlobalFilters(new GlobalErrorHandler(app.get(HttpAdapterHost)))
  await app.listen(process.env.PORT ?? 3333)
}

bootstrap()

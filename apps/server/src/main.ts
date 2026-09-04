import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { cleanupOpenApiDoc } from 'nestjs-zod'

import { AppModule } from '@/app.module'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { configureCors } from '@/shared/rest/configure-cors'
import { GlobalErrorHandler } from '@/shared/rest/filters'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })

  const openApiConfig = new DocumentBuilder()
    .setTitle('HMS REST API')
    .setDescription('HTTP API for the HMS platform')
    .setVersion('1.0')
    .build()
  const openApiDocument = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, openApiConfig),
  )

  app.use(
    '/docs',
    apiReference({
      content: openApiDocument,
      pageTitle: 'HMS REST API Reference',
    }),
  )

  // biome-ignore lint/correctness/useHookAtTopLevel: Nest global filter registration is not a React hook.
  app.useGlobalFilters(new GlobalErrorHandler(app.get(HttpAdapterHost)))

  const envProvider = app.get(EnvProvider)

  configureCors(app, envProvider.get('HMS_WEB_APP_URL'))

  await app.listen(envProvider.get('HMS_SERVER_APP_PORT'))
}

bootstrap()

import type { INestApplication } from '@nestjs/common'

import { SIGNING_GATEWAY_CSRF_HEADER } from '@/shared/rest/signing-gateway-headers'

export function configureCors(app: INestApplication, webAppUrl: string) {
  app.enableCors({
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      SIGNING_GATEWAY_CSRF_HEADER,
    ],
    exposedHeaders: [SIGNING_GATEWAY_CSRF_HEADER],
    origin: webAppUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })
}

import { NestFactory } from '@nestjs/core'
import { SeedModule } from './seed.module'
import { ParametroSistemaSeed } from './parametro-sistema.seed'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule)
  
  const seeds = [
    app.get(ParametroSistemaSeed),
  ]

  for (const seed of seeds) {
    await seed.run()
  }

  await app.close()
  process.exit(0)
}

bootstrap()
import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '@/app.module';
import * as Entities from '@/entities';
import metadata from '@/metadata';

declare const module: {
  hot?: {
    accept: () => void
    dispose: (callback: (data: unknown) => void) => void
  }
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.NODE_ENV !== 'production' ? true : [],
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Admin API')
      .setDescription('The Admin API description')
      .setVersion('1.0')
      .build();

    await SwaggerModule.loadPluginMetadata(metadata);
    const document = SwaggerModule.createDocument(app, config, {
      extraModels: Object.entries(Entities).reduce((acc, [key, value]) => {
        if (
          typeof value === 'function'
          && !key.endsWith('Core')
          && !key.endsWith('Repository')
        ) {
          acc.push(value);
        }
        return acc;
      }, [] as (abstract new (...args: never[]) => unknown)[]),
    });
    SwaggerModule.setup('docs', app, document);
  }
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => {
      app.close().catch((err) => console.error('Error closing app during HMR:', err));
    });
  }
}

void bootstrap();

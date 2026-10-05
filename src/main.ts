import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `GraphQL and Sandbox: http://localhost:${port}/graphql`,
    'Bootstrap',
  );
}

bootstrap().catch((error: unknown) => {
  console.error('application: failed:', error);
  process.exitCode = 1;
});

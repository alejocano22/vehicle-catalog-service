import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GraphqlExceptionFilter } from './common/filters/graphql-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalFilters(new GraphqlExceptionFilter());

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application started successfully on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error('Fatal error during application bootstrap:', error);
  process.exit(1);
});

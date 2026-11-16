import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { validationFailed } from './common/errors/app.exception';
import { flattenValidationErrors } from './common/errors/validation-errors';

export const configureApp = (app: NestExpressApplication): NestExpressApplication => {
  app.useLogger(app.get(Logger));
  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => validationFailed(flattenValidationErrors(errors)),
    }),
  );
  app.enableShutdownHooks();
  return app;
};

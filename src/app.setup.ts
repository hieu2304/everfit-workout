import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Everfit Workout Logging API')
      .setDescription(
        'Log workouts, browse history, and track personal records. No auth: userId is a path parameter.',
      )
      .setVersion('1.0')
      .build(),
  );
  SwaggerModule.setup('docs', app, document);
  app.enableShutdownHooks();
  return app;
};

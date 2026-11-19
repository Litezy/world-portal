import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { isSwaggerEnabled } from './common/swagger-enabled';
import { resolveServiceKey } from './auth/service-key';

function formatValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      result[path] = Object.values(error.constraints);
    }

    if (error.children?.length) {
      Object.assign(result, formatValidationErrors(error.children, path));
    }
  }

  return result;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  // Fail at boot, not later as unexplained 401s, when production is missing
  // the key the admin console and agency portal servers must present.
  resolveServiceKey(process.env);
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException({
          message: 'Validation failed',
          errors: formatValidationErrors(errors),
        }),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('World Portal API')
    .setDescription(
      'Travel Passport & Visa Processing Platform API Documentation',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Profiles', 'User profiles and account role management')
    .addTag('Payments', 'Payment markup calculations and record initiation')
    .addTag(
      'Visa Documentation',
      'Passport and visa document verification workflows',
    )
    .build();

  const swaggerEnabled = isSwaggerEnabled(process.env);
  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(
    swaggerEnabled
      ? `Swagger OpenAPI documentation available at: http://localhost:${port}/api/docs`
      : 'Swagger docs are off (production; set ENABLE_SWAGGER=true to serve them)',
  );
}

void bootstrap();

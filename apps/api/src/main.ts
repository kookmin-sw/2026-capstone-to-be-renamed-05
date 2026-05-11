import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { isServerRuntime } from './config/runtime-environment';

type TrustProxyApplication = {
  set(name: 'trust proxy', value: number): void;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app
    .getHttpAdapter()
    .getInstance() as TrustProxyApplication;
  expressApp.set('trust proxy', 1);

  app.use(helmet());
  app.use(cookieParser());
  const webOrigin = process.env.WEB_ORIGIN?.trim();
  if (!webOrigin && isServerRuntime()) {
    throw new Error('WEB_ORIGIN must be set when APP_ENV=aws.');
  }

  app.enableCors({
    origin: (webOrigin ?? 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CPA Job Platform API')
      .setDescription('REST API for CPA-focused job curation prototype')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();

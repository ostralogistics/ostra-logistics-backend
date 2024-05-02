import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AbstractWsAdapter } from '@nestjs/websockets';
import * as express from 'express'
import { join } from 'path';
import { UploadService } from './common/helpers/upload.service';
import * as cors from "cors"
async function bootstrap() {


  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1/ostra-logistics_api')
  app.useGlobalPipes(new ValidationPipe)

  //uploaded file function 
  UploadService

  app.use('/public',express.static(join(__dirname,'..','public')))

  app.use(cors({origin:"*"})) //will change later after deployment

  await app.listen(3000||process.env.PORT);
}
bootstrap();

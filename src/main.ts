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

  app.use(cors({origin:"*"})) //will change later after deployment

  app.use('/public',express.static(join(__dirname,'..','public')))
  console.log('Serving static files from:', join(__dirname, '..', 'public'));

  app.setGlobalPrefix('api/v1/ostra-logistics_api')
  app.useGlobalPipes(new ValidationPipe)

 

  await app.listen(process.env.PORT||8000);
}
bootstrap();

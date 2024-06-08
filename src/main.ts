import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AbstractWsAdapter } from '@nestjs/websockets';
import * as express from 'express'
import { join } from 'path';
import { UploadService } from './common/helpers/upload.service';
import * as cors from "cors"
import { ConfigService } from '@nestjs/config';
import { ServiceAccount } from 'firebase-admin';
async function bootstrap() {


  const app = await NestFactory.create(AppModule);

  app.use(cors({origin:"*"})) //will change later after deployment

  const configService: ConfigService = app.get(ConfigService)



  app.use('/public',express.static(join(__dirname,'..','public')))
  console.log('Serving static files from:', join(__dirname, '..', 'public'));

  app.setGlobalPrefix('api/v1/ostra-logistics_api')
  app.useGlobalPipes(new ValidationPipe)

 

  await app.listen(process.env.PORT||8000);

//   const { rss, heapTotal, heapUsed, external } = process.memoryUsage();

// console.log('Memory Usage:');
// console.log(`  RSS: ${rss / 1024 / 1024} MB`);  // Resident Set Size (total memory allocated)
// console.log(`  Heap Total: ${heapTotal / 1024 / 1024} MB`);  // Total heap size allocated
// console.log(`  Heap Used: ${heapUsed / 1024 / 1024} MB`);  // Memory used by the JavaScript heap
// console.log(`  External: ${external / 1024 / 1024} MB`);  // Memory used by C++ objects
// 
}
bootstrap();

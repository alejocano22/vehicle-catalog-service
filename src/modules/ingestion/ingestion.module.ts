import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { NhtsaApiClient } from './infrastructure/http/nhtsa-api.client';
import { XmlParserService } from './infrastructure/xml/xml-parser.service';
import { VehicleCatalogTransformer } from './application/vehicle-catalog.transformer';
import { IngestionService } from './application/ingestion.service';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';

@Module({
  imports: [HttpModule.register({
    httpAgent: new HttpAgent({ keepAlive: true }),
    httpsAgent: new HttpsAgent({ keepAlive: true }),
  }),
  forwardRef(() => VehiclesModule),],
  providers: [
    NhtsaApiClient,
    XmlParserService,
    VehicleCatalogTransformer,
    IngestionService,
  ],
  exports: [IngestionService],
})
export class IngestionModule { }

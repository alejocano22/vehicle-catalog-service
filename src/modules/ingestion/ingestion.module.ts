import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { NhtsaApiClient } from './infrastructure/http/nhtsa-api.client';
import { XmlParserService } from './infrastructure/xml/xml-parser.service';
import { VehicleCatalogTransformer } from './application/vehicle-catalog.transformer';
import { IngestionService } from './application/ingestion.service';

@Module({
  imports: [HttpModule, forwardRef(() => VehiclesModule)],
  providers: [
    NhtsaApiClient,
    XmlParserService,
    VehicleCatalogTransformer,
    IngestionService,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}

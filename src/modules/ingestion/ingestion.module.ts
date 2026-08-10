import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NhtsaApiClient } from './infrastructure/http/nhtsa-api.client';
import { XmlParserService } from './infrastructure/xml/xml-parser.service';

@Module({
  imports: [HttpModule],
  providers: [NhtsaApiClient, XmlParserService],
  exports: [NhtsaApiClient, XmlParserService],
})
export class IngestionModule { }

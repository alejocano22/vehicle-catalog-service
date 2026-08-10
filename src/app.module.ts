import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';

@Module({
  imports: [ConfigModule, IngestionModule],
  controllers: [],
  providers: [],
})
export class AppModule { }

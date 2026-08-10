import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { DatabaseModule } from './database/database.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

@Module({
  imports: [ConfigModule, DatabaseModule, IngestionModule, VehiclesModule],
  controllers: [],
  providers: [],
})
export class AppModule { }

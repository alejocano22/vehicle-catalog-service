import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { GraphQLApiModule } from './graphql/graphql.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

@Module({
  imports: [ConfigModule, DatabaseModule, GraphQLApiModule, IngestionModule, VehiclesModule],
})

export class AppModule { }

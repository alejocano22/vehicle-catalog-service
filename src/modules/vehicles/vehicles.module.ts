import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MakeEntity } from './infrastructure/persistence/make.entity';
import { VehicleTypeEntity } from './infrastructure/persistence/vehicle-type.entity';
import { VehicleCatalogRepository } from './infrastructure/persistence/vehicle-catalog.repository';
import { VehiclesResolver } from './presentation/vehicles.resolver';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MakeEntity, VehicleTypeEntity]),
    forwardRef(() => IngestionModule),
  ],
  providers: [VehicleCatalogRepository, VehiclesResolver],
  exports: [VehicleCatalogRepository],
})
export class VehiclesModule {}

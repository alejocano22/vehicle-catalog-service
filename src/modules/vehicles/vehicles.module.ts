import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MakeEntity } from './infrastructure/persistence/make.entity';
import { VehicleTypeEntity } from './infrastructure/persistence/vehicle-type.entity';
import { VehicleCatalogRepository } from './infrastructure/persistence/vehicle-catalog.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MakeEntity, VehicleTypeEntity])],
  providers: [VehicleCatalogRepository],
  exports: [VehicleCatalogRepository],
})

export class VehiclesModule { }

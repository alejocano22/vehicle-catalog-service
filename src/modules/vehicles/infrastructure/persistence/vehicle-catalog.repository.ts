import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MakeEntity } from './make.entity';
import { VehicleTypeEntity } from './vehicle-type.entity';
import { MakeWithVehicleTypes } from '../../../ingestion/domain/vehicle-catalog.types';

@Injectable()
export class VehicleCatalogRepository {
  private readonly logger = new Logger(VehicleCatalogRepository.name);

  constructor(
    @InjectRepository(MakeEntity)
    private readonly makeRepository: Repository<MakeEntity>,
  ) {}

  // Persists the transformed catalog, upserting by makeId so re-running doesn't create duplicate makes
  async saveCatalog(catalog: MakeWithVehicleTypes[]): Promise<void> {
    for (const make of catalog) {
      try {
        await this.upsertMake(make);
      } catch (error) {
        this.logger.error(
          `Failed to persist make ${make.makeId} (${make.makeName})`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new VehicleCatalogPersistenceError(
          `Failed to persist make ${make.makeId}`,
          error,
        );
      }
    }
  }

  async findAll(): Promise<MakeEntity[]> {
    return this.makeRepository.find({ relations: { vehicleTypes: true } });
  }

  private async upsertMake(make: MakeWithVehicleTypes): Promise<void> {
    let entity = await this.makeRepository.findOne({
      where: { makeId: make.makeId },
      relations: { vehicleTypes: true },
    });

    if (!entity) {
      entity = this.makeRepository.create({ makeId: make.makeId });
    }

    entity.makeName = make.makeName;
    entity.vehicleTypes = make.vehicleTypes.map((vt) =>
      Object.assign(new VehicleTypeEntity(), {
        typeId: vt.typeId,
        typeName: vt.typeName,
      }),
    );

    await this.makeRepository.save(entity);
  }
}

export class VehicleCatalogPersistenceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'VehicleCatalogPersistenceError';
  }
}

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NhtsaApiClient } from '../infrastructure/http/nhtsa-api.client';
import { XmlParserService } from '../infrastructure/xml/xml-parser.service';
import { VehicleCatalogTransformer } from './vehicle-catalog.transformer';
import { VehicleCatalogRepository } from '../../vehicles/infrastructure/persistence/vehicle-catalog.repository';
import {
  NhtsaAllMakesResponse,
  NhtsaVehicleTypesResponse,
  NhtsaMakeXml,
  NhtsaVehicleTypeXml,
} from '../domain/nhtsa-response.types';
import { MakeWithVehicleTypes } from '../domain/vehicle-catalog.types';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly makesLimit: number;

  constructor(
    private readonly nhtsaApiClient: NhtsaApiClient,
    private readonly xmlParserService: XmlParserService,
    private readonly transformer: VehicleCatalogTransformer,
    private readonly repository: VehicleCatalogRepository,
    private readonly configService: ConfigService,
  ) {
    this.makesLimit = this.configService.get<number>('INGESTION_MAKES_LIMIT')!;
  }

  // Runs ingestion once automatically when the application finishes bootstrapping
  // async onApplicationBootstrap(): Promise<void> {
  //   try {
  //     await this.run();
  //   } catch (error) {
  //     this.logger.error(
  //       'Automatic startup ingestion failed; the service will start anyway. Use the manual ingestion trigger to retry.',
  //       error instanceof Error ? error.stack : undefined,
  //     );
  //   }
  // }

  async run(): Promise<MakeWithVehicleTypes[]> {
    this.logger.log('Starting vehicle catalog ingestion');

    const makes = await this.fetchAllMakes();
    const limitedMakes = makes.slice(0, this.makesLimit);

    this.logger.log(
      `Fetched ${makes.length} total makes, processing ${limitedMakes.length} (INGESTION_MAKES_LIMIT=${this.makesLimit})`,
    );

    const vehicleTypesByMakeId =
      await this.fetchVehicleTypesForMakes(limitedMakes);
    const catalog = this.transformer.transformCatalog(
      limitedMakes,
      vehicleTypesByMakeId,
    );

    await this.repository.saveCatalog(catalog);

    this.logger.log(`Ingestion complete: ${catalog.length} makes persisted`);
    return catalog;
  }

  private async fetchAllMakes(): Promise<NhtsaMakeXml[]> {
    const xml = await this.nhtsaApiClient.getAllMakesXml();
    const parsed = this.xmlParserService.parse<NhtsaAllMakesResponse>(xml);
    return parsed.Response.Results.AllVehicleMakes;
  }

  private async fetchVehicleTypesForMakes(
    makes: NhtsaMakeXml[],
  ): Promise<Map<number, NhtsaVehicleTypeXml[] | undefined>> {
    const result = new Map<number, NhtsaVehicleTypeXml[] | undefined>();

    for (const make of makes) {
      try {
        const xml = await this.nhtsaApiClient.getVehicleTypesForMakeXml(
          String(make.Make_ID),
        );
        const parsed =
          this.xmlParserService.parse<NhtsaVehicleTypesResponse>(xml);
        result.set(
          make.Make_ID,
          parsed.Response.Results.VehicleTypesForMakeIds,
        );
      } catch (error) {
        this.logger.error(
          `Failed to fetch vehicle types for make ${make.Make_ID} (${make.Make_Name}); continuing with empty vehicleTypes`,
          error instanceof Error ? error.stack : undefined,
        );
        result.set(make.Make_ID, undefined);
      }
    }

    return result;
  }
}

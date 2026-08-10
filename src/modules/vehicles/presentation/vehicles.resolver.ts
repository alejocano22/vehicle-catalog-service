import { Query, Mutation, Resolver } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { MakeGraphQLType } from './make.type';
import { toMakeGraphQLType } from './vehicle-catalog.mapper';
import { VehicleCatalogRepository } from '../infrastructure/persistence/vehicle-catalog.repository';
import { IngestionService } from '../../ingestion/application/ingestion.service';

@Resolver(() => MakeGraphQLType)
export class VehiclesResolver {
  private readonly logger = new Logger(VehiclesResolver.name);

  constructor(
    private readonly repository: VehicleCatalogRepository,
    private readonly ingestionService: IngestionService,
  ) {}

  @Query(() => [MakeGraphQLType], {
    description: 'Returns the full stored vehicle catalog (makes with their vehicle types).',
  })
  async makes(): Promise<MakeGraphQLType[]> {
    const entities = await this.repository.findAll();
    return entities.map(toMakeGraphQLType);
  }

  @Mutation(() => [MakeGraphQLType], {
    description:
      'Manually re-runs the ingestion pipeline (fetch from NHTSA, transform, persist) and returns the resulting catalog.',
  })
  async triggerIngestion(): Promise<MakeGraphQLType[]> {
    this.logger.log('Manual ingestion triggered via GraphQL mutation');
    const catalog = await this.ingestionService.run();
    return catalog.map((make) => ({
      makeId: make.makeId,
      makeName: make.makeName,
      vehicleTypes: make.vehicleTypes,
    }));
  }
}
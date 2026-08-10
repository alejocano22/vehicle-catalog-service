import { Test } from '@nestjs/testing';
import { VehiclesResolver } from './vehicles.resolver';
import { VehicleCatalogRepository } from '../infrastructure/persistence/vehicle-catalog.repository';
import { IngestionService } from '../../ingestion/application/ingestion.service';
import { MakeEntity } from '../infrastructure/persistence/make.entity';

describe('VehiclesResolver', () => {
  let resolver: VehiclesResolver;
  let mockRepository: jest.Mocked<VehicleCatalogRepository>;
  let mockIngestionService: jest.Mocked<IngestionService>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<VehicleCatalogRepository>;

    mockIngestionService = {
      run: jest.fn(),
    } as unknown as jest.Mocked<IngestionService>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        VehiclesResolver,
        { provide: VehicleCatalogRepository, useValue: mockRepository },
        { provide: IngestionService, useValue: mockIngestionService },
      ],
    }).compile();

    resolver = moduleRef.get(VehiclesResolver);
  });

  describe('makes query', () => {
    it('maps stored entities to the GraphQL shape', async () => {
      const entity = Object.assign(new MakeEntity(), {
        makeId: '440',
        makeName: 'ASTON MARTIN',
        vehicleTypes: [{ typeId: '2', typeName: 'Passenger Car' }],
      });
      mockRepository.findAll.mockResolvedValue([entity]);

      const result = await resolver.makes();

      expect(result).toEqual([
        {
          makeId: '440',
          makeName: 'ASTON MARTIN',
          vehicleTypes: [{ typeId: '2', typeName: 'Passenger Car' }],
        },
      ]);
    });

    it('returns an empty array when nothing is stored yet', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await resolver.makes();

      expect(result).toEqual([]);
    });
  });

  describe('triggerIngestion mutation', () => {
    it('runs the ingestion pipeline and returns the fresh catalog', async () => {
      mockIngestionService.run.mockResolvedValue([
        { makeId: '440', makeName: 'ASTON MARTIN', vehicleTypes: [] },
      ]);

      const result = await resolver.triggerIngestion();

      expect(mockIngestionService.run).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { makeId: '440', makeName: 'ASTON MARTIN', vehicleTypes: [] },
      ]);
    });
  });
});

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IngestionService } from './ingestion.service';
import { NhtsaApiClient } from '../infrastructure/http/nhtsa-api.client';
import { XmlParserService } from '../infrastructure/xml/xml-parser.service';
import { VehicleCatalogTransformer } from './vehicle-catalog.transformer';
import { VehicleCatalogRepository } from './../../vehicles/infrastructure/persistence/vehicle-catalog.repository';

const ALL_MAKES_XML = `
  <Response>
    <Results>
      <AllVehicleMakes><Make_ID>440</Make_ID><Make_Name>ASTON MARTIN</Make_Name></AllVehicleMakes>
      <AllVehicleMakes><Make_ID>441</Make_ID><Make_Name>TESLA</Make_Name></AllVehicleMakes>
    </Results>
  </Response>
`;

const VEHICLE_TYPES_XML = `
  <Response>
    <Results>
      <VehicleTypesForMakeIds><VehicleTypeId>2</VehicleTypeId><VehicleTypeName>Passenger Car</VehicleTypeName></VehicleTypesForMakeIds>
    </Results>
  </Response>
`;

describe('IngestionService', () => {
  let service: IngestionService;
  let mockApiClient: jest.Mocked<NhtsaApiClient>;
  let mockRepository: jest.Mocked<VehicleCatalogRepository>;

  beforeEach(async () => {
    mockApiClient = {
      getAllMakesXml: jest.fn().mockResolvedValue(ALL_MAKES_XML),
      getVehicleTypesForMakeXml: jest.fn().mockResolvedValue(VEHICLE_TYPES_XML),
    } as unknown as jest.Mocked<NhtsaApiClient>;

    mockRepository = {
      saveCatalog: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<VehicleCatalogRepository>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestionService,
        XmlParserService,
        VehicleCatalogTransformer,
        { provide: NhtsaApiClient, useValue: mockApiClient },
        { provide: VehicleCatalogRepository, useValue: mockRepository },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(50) },
        },
      ],
    }).compile();

    service = moduleRef.get(IngestionService);
  });

  it('runs the full pipeline and returns the normalized catalog', async () => {
    const result = await service.run();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      makeId: '440',
      makeName: 'ASTON MARTIN',
      vehicleTypes: [{ typeId: '2', typeName: 'Passenger Car' }],
    });
    expect(mockApiClient.getVehicleTypesForMakeXml).toHaveBeenCalledTimes(2);
  });

  it('continues processing when a single make fails to fetch vehicle types', async () => {
    mockApiClient.getVehicleTypesForMakeXml
      .mockResolvedValueOnce(VEHICLE_TYPES_XML)
      .mockRejectedValueOnce(new Error('NHTSA request timed out'));

    const result = await service.run();

    expect(result).toHaveLength(2);
    expect(result[1].vehicleTypes).toEqual([]);
  });

  it('aborts the pipeline when fetching the makes list itself fails', async () => {
    mockApiClient.getAllMakesXml.mockRejectedValue(new Error('NHTSA is down'));

    await expect(service.run()).rejects.toThrow('NHTSA is down');
  });

  it('persists the transformed catalog via the repository', async () => {
    await service.run();

    expect(mockRepository.saveCatalog).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveCatalog).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ makeId: '440', makeName: 'ASTON MARTIN' }),
      ]),
    );
  });
});

import { VehicleCatalogTransformer } from './vehicle-catalog.transformer';
import { NhtsaMakeXml, NhtsaVehicleTypeXml } from '../domain/nhtsa-response.types';

describe('VehicleCatalogTransformer', () => {
  let transformer: VehicleCatalogTransformer;

  beforeEach(() => {
    transformer = new VehicleCatalogTransformer();
  });

  describe('transformMake', () => {
    it('combines a make with its vehicle types into the final shape', () => {
      const make: NhtsaMakeXml = { Make_ID: 440, Make_Name: 'ASTON MARTIN' };
      const vehicleTypes: NhtsaVehicleTypeXml[] = [
        { VehicleTypeId: 2, VehicleTypeName: 'Passenger Car' },
        { VehicleTypeId: 7, VehicleTypeName: 'Multipurpose Passenger Vehicle (MPV)' },
      ];

      const result = transformer.transformMake(make, vehicleTypes);

      expect(result).toEqual({
        makeId: '440',
        makeName: 'ASTON MARTIN',
        vehicleTypes: [
          { typeId: '2', typeName: 'Passenger Car' },
          { typeId: '7', typeName: 'Multipurpose Passenger Vehicle (MPV)' },
        ],
      });
    });

    it('normalizes numeric IDs to strings', () => {
      const make: NhtsaMakeXml = { Make_ID: 440, Make_Name: 'ASTON MARTIN' };

      const result = transformer.transformMake(make, []);

      expect(typeof result.makeId).toBe('string');
    });

    it('returns an empty vehicleTypes array when the make has no associated types', () => {
      const make: NhtsaMakeXml = { Make_ID: 99999, Make_Name: 'UNKNOWN MAKE' };

      const result = transformer.transformMake(make, undefined);

      expect(result.vehicleTypes).toEqual([]);
    });
  });

  describe('transformCatalog', () => {
    it('maps each make to its corresponding vehicle types via the lookup map', () => {
      const makes: NhtsaMakeXml[] = [
        { Make_ID: 440, Make_Name: 'ASTON MARTIN' },
        { Make_ID: 441, Make_Name: 'TESLA' },
      ];
      const vehicleTypesByMakeId = new Map<number, NhtsaVehicleTypeXml[] | undefined>([
        [440, [{ VehicleTypeId: 2, VehicleTypeName: 'Passenger Car' }]],
        [441, [{ VehicleTypeId: 7, VehicleTypeName: 'MPV' }]],
      ]);

      const result = transformer.transformCatalog(makes, vehicleTypesByMakeId);

      expect(result).toHaveLength(2);
      expect(result[0].makeName).toBe('ASTON MARTIN');
      expect(result[1].makeName).toBe('TESLA');
    });

    it('handles a make missing from the lookup map (failed fetch) as empty vehicleTypes', () => {
      const makes: NhtsaMakeXml[] = [{ Make_ID: 440, Make_Name: 'ASTON MARTIN' }];
      const vehicleTypesByMakeId = new Map<number, NhtsaVehicleTypeXml[] | undefined>();

      const result = transformer.transformCatalog(makes, vehicleTypesByMakeId);

      expect(result[0].vehicleTypes).toEqual([]);
    });

    it('preserves make order from the input array', () => {
      const makes: NhtsaMakeXml[] = [
        { Make_ID: 2, Make_Name: 'B_MAKE' },
        { Make_ID: 1, Make_Name: 'A_MAKE' },
      ];
      const vehicleTypesByMakeId = new Map<number, NhtsaVehicleTypeXml[] | undefined>();

      const result = transformer.transformCatalog(makes, vehicleTypesByMakeId);

      expect(result.map((m) => m.makeName)).toEqual(['B_MAKE', 'A_MAKE']);
    });
  });
});
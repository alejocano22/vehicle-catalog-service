import { Injectable } from '@nestjs/common';
import {
  NhtsaMakeXml,
  NhtsaVehicleTypeXml,
} from '../domain/nhtsa-response.types';
import { MakeWithVehicleTypes } from '../domain/vehicle-catalog.types';

@Injectable()
export class VehicleCatalogTransformer {
  transformMake(
    make: NhtsaMakeXml,
    vehicleTypes: NhtsaVehicleTypeXml[] | undefined,
  ): MakeWithVehicleTypes {
    return {
      makeId: String(make.Make_ID),
      makeName: make.Make_Name,
      // vehicleTypes is undefined when a make has zero associated types
      vehicleTypes: (vehicleTypes ?? []).map((vt) => ({
        typeId: String(vt.VehicleTypeId),
        typeName: vt.VehicleTypeName,
      })),
    };
  }

  /**
   * Combines a list of raw makes with a map of their raw vehicle types
   * (keyed by Make_ID) into the final normalized array.
   */
  transformCatalog(
    makes: NhtsaMakeXml[],
    vehicleTypesByMakeId: Map<number, NhtsaVehicleTypeXml[] | undefined>,
  ): MakeWithVehicleTypes[] {
    return makes.map((make) =>
      this.transformMake(make, vehicleTypesByMakeId.get(make.Make_ID)),
    );
  }
}
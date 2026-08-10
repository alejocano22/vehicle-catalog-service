export interface VehicleType {
  typeId: string;
  typeName: string;
}

export interface MakeWithVehicleTypes {
  makeId: string;
  makeName: string;
  vehicleTypes: VehicleType[];
}

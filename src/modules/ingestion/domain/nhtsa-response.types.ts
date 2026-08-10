export interface NhtsaMakeXml {
  Make_ID: number;
  Make_Name: string;
}

export interface NhtsaAllMakesResponse {
  Response: {
    Count: number;
    Message: string;
    Results: {
      AllVehicleMakes: NhtsaMakeXml[];
    };
  };
}

export interface NhtsaVehicleTypeXml {
  VehicleTypeId: number;
  VehicleTypeName: string;
}

export interface NhtsaVehicleTypesResponse {
  Response: {
    Count: number;
    Message: string;
    SearchCriteria: string;
    Results: {
      VehicleTypesForMakeIds: NhtsaVehicleTypeXml[];
    };
  };
}

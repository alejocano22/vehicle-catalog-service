import { XmlParserService, XmlParsingError } from './xml-parser.service';
import {
  NhtsaAllMakesResponse,
  NhtsaVehicleTypesResponse,
} from '../../domain/nhtsa-response.types';

describe('XmlParserService', () => {
  let service: XmlParserService;

  beforeEach(() => {
    service = new XmlParserService();
  });

  describe('parsing GetAllMakes responses', () => {
    it('parses multiple makes into an array', () => {
      const xml = `
        <Response>
          <Count>2</Count>
          <Message>Response returned successfully</Message>
          <Results>
            <AllVehicleMakes>
              <Make_ID>440</Make_ID>
              <Make_Name>ASTON MARTIN</Make_Name>
            </AllVehicleMakes>
            <AllVehicleMakes>
              <Make_ID>441</Make_ID>
              <Make_Name>TESLA</Make_Name>
            </AllVehicleMakes>
          </Results>
        </Response>
      `;

      const result = service.parse<NhtsaAllMakesResponse>(xml);

      expect(result.Response.Results.AllVehicleMakes).toHaveLength(2);
      expect(result.Response.Results.AllVehicleMakes[0]).toEqual({
        Make_ID: 440,
        Make_Name: 'ASTON MARTIN',
      });
    });

    it('parses a single make as an array, not a bare object', () => {
      const xml = `
        <Response>
          <Count>1</Count>
          <Message>Response returned successfully</Message>
          <Results>
            <AllVehicleMakes>
              <Make_ID>440</Make_ID>
              <Make_Name>ASTON MARTIN</Make_Name>
            </AllVehicleMakes>
          </Results>
        </Response>
      `;

      const result = service.parse<NhtsaAllMakesResponse>(xml);

      expect(Array.isArray(result.Response.Results.AllVehicleMakes)).toBe(true);
      expect(result.Response.Results.AllVehicleMakes).toHaveLength(1);
    });
  });

  describe('parsing GetVehicleTypesForMakeId responses', () => {
    it('parses vehicle types into an array', () => {
      const xml = `
        <Response>
          <Count>2</Count>
          <Message>Response returned successfully</Message>
          <SearchCriteria>Make ID: 440</SearchCriteria>
          <Results>
            <VehicleTypesForMakeIds>
              <VehicleTypeId>2</VehicleTypeId>
              <VehicleTypeName>Passenger Car</VehicleTypeName>
            </VehicleTypesForMakeIds>
            <VehicleTypesForMakeIds>
              <VehicleTypeId>7</VehicleTypeId>
              <VehicleTypeName>Multipurpose Passenger Vehicle (MPV)</VehicleTypeName>
            </VehicleTypesForMakeIds>
          </Results>
        </Response>
      `;

      const result = service.parse<NhtsaVehicleTypesResponse>(xml);

      expect(result.Response.Results.VehicleTypesForMakeIds).toHaveLength(2);
      expect(result.Response.Results.VehicleTypesForMakeIds[1]).toEqual({
        VehicleTypeId: 7,
        VehicleTypeName: 'Multipurpose Passenger Vehicle (MPV)',
      });
    });

    it('parses an empty Results block without throwing', () => {
      const xml = `
        <Response>
          <Count>0</Count>
          <Message>Response returned successfully</Message>
          <SearchCriteria>Make ID: 99999</SearchCriteria>
          <Results></Results>
        </Response>
      `;

      const result = service.parse<NhtsaVehicleTypesResponse>(xml);

      expect(result.Response.Results.VehicleTypesForMakeIds).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws XmlParsingError when given malformed XML', () => {
      const malformedXml = '<Response><A>1</B></Response>';
      expect(() => service.parse(malformedXml)).toThrow(XmlParsingError);
    });
  });
});

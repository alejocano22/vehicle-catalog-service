import { MakeEntity } from '../infrastructure/persistence/make.entity';
import { MakeGraphQLType } from './make.type';

export function toMakeGraphQLType(entity: MakeEntity): MakeGraphQLType {
  return {
    makeId: entity.makeId,
    makeName: entity.makeName,
    vehicleTypes: (entity.vehicleTypes ?? []).map((vt) => ({
      typeId: vt.typeId,
      typeName: vt.typeName,
    })),
  };
}

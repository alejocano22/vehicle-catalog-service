import { Field, ObjectType, ID } from '@nestjs/graphql';
import { VehicleTypeGraphQLType } from './vehicle-type.type';

@ObjectType('Make', {
  description:
    'A vehicle make (manufacturer) and its associated vehicle types.',
})
export class MakeGraphQLType {
  @Field(() => ID)
  makeId: string;

  @Field()
  makeName: string;

  @Field(() => [VehicleTypeGraphQLType])
  vehicleTypes: VehicleTypeGraphQLType[];
}

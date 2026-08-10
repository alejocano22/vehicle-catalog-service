import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType('VehicleType', {
  description: 'A vehicle type associated with a make (e.g. Passenger Car, Truck).',
})
export class VehicleTypeGraphQLType {
  @Field(() => ID)
  typeId: string;

  @Field()
  typeName: string;
}

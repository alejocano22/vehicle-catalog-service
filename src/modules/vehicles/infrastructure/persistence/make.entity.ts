import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VehicleTypeEntity } from './vehicle-type.entity';

@Entity({ name: 'makes' })
export class MakeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Original ID from the NHTSA API
  @Column({ name: 'make_id', unique: true })
  makeId: string;

  @Column({ name: 'make_name' })
  makeName: string;

  @OneToMany(() => VehicleTypeEntity, (vehicleType) => vehicleType.make, {
    cascade: true,
  })
  vehicleTypes: VehicleTypeEntity[];
}

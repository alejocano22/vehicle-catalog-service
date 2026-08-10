import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MakeEntity } from './make.entity';

@Entity({ name: 'vehicle_types' })
export class VehicleTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Original ID from the NHTSA API
  @Column({ name: 'type_id' })
  typeId: string;

  @Column({ name: 'type_name' })
  typeName: string;

  @ManyToOne(() => MakeEntity, (make) => make.vehicleTypes, {
    onDelete: 'CASCADE',
  })
  make: MakeEntity;
}

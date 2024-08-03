import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PaymentMappingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderID: string;

  @Column()
  reference: string;
}

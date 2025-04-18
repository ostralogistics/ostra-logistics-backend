// the table that holds all the orders and it will have its relatiohip with the customer and also have relationship with the rider who the order was assigned to and then it will be saved to the tasks given
import {
  BidStatus,
  OrderDisplayStatus,
  OrderStatus,
  PaymentStatus,
  PriorityDeliveryType,
  VehicleType,
} from 'src/Enums/all-enums';
import { IOrder } from 'src/order/order';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Admin,
  PrimaryColumn,
} from 'typeorm';
import { CustomerEntity } from './customers.entity';
import { RiderEntity } from './riders.entity';
import { BidEntity } from './bids.entity';
import { TaskEntity } from './ridersTasks.entity';
import { Exclude, Type } from 'class-transformer';
import { AdminEntity } from './admins.entity';
import { VehicleEntity } from './vehicle.entity';
import { VehicleTypeEntity } from './vehicleType.entity';
import { TransactionEntity } from './transactions.entity';
import { ReceiptEntity } from './receipt.entity';

@Entity('orders')
export class OrderEntity implements IOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  orderID: string;

  @Column({ nullable: true,type:'timestamp' })
  orderPlacedAt: Date;


  @Column({ nullable: true,type:'timestamp' })
  payment_verifiedAT: Date;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItemEntity[];

  @Column({ nullable: true,type:'timestamp' })
  processingOrderAT: Date;
  
  @Column({ nullable: true, type: 'enum', enum: PaymentStatus })
  payment_status: PaymentStatus;

  @Column({ nullable: true,type:'timestamp' })
  paymentVerifiedAT: Date;

  @Column({ nullable: true,type:'timestamp' })
  RiderAssignedAT:Date;

  @Column({ nullable: true,type:'timestamp' })
  EnrouteToPickupAT:Date;

  @Column({ nullable: true, type: 'enum', enum: OrderStatus })
  order_status: OrderStatus;

  @Column({ nullable: true,type:'timestamp' })
  AtThePickUpLocationAT:Date;

  @Column({ nullable: true,type:'timestamp' })
  RiderRecieveParcelAT:Date;

  @Column({ nullable: true,type:'timestamp' })
  EnrouteToOfficeAT:Date;

  @Column({ nullable: true,type:'timestamp' })
  ArrivesAtTheOfficeAT:Date;


  @Column({ nullable: true,type:'timestamp' })
  EnrouteToDropOffAT:Date;

  @Column({ nullable: true,type:'timestamp' })
  RiderAtDropOffLocationAT:Date;

  @Column({ nullable: true,type:'timestamp' })
  DeliveredAT:Date;

  @Column({ nullable: true, type: 'enum', enum: BidStatus })
  bidStatus: BidStatus;


  @Column({ length: 255, nullable: true })
  trackingID: string;

  @Column({ nullable: true })
  dropoffCode: string;

  @Column({ nullable: true })
  barcodeDigits :string

  @Column('numeric', { nullable: true })
  accepted_cost_of_delivery: number;

  @Column('numeric', { nullable: true })
  VAT:number

  @Column('numeric', { nullable: true })
  discount?: number;

  @Column({nullable:true, type:'boolean', default:false})
  IsDiscountApplied:boolean

  @OneToMany(() => BidEntity, bid => bid.order) // One-to-many relationship with bids
  bid: BidEntity[];

  @ManyToOne(() => RiderEntity, (rider) => rider.assigned_order,{nullable:true})
  Rider: RiderEntity;

  @ManyToOne(() => CustomerEntity, (owner) => owner.my_orders)
  customer: CustomerEntity;

  
  @Column({nullable:true, type:'boolean', default:false})
  isExpressDelivery : boolean


  @ManyToOne(() => AdminEntity, (owner) => owner.my_orders)
  admin: AdminEntity;

  @OneToMany(() => TaskEntity, (task) => task.assigned_order,{nullable:true})
  assigned_task: TaskEntity;

  @Column({ nullable: true, type: 'enum', enum: OrderDisplayStatus })
  order_display_status: OrderDisplayStatus;

  @OneToOne(() => TransactionEntity, (transaction) => transaction.order)
  @JoinColumn()
  transaction: TransactionEntity;

  @OneToOne(() => ReceiptEntity, (receipt) => receipt.order)
  receipt: ReceiptEntity;

  @Column({ type: 'float', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string;

}


//orderItems

@Entity({ name: 'OrderItems' })
export class OrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OrderEntity, (order) => order.items)
  order: OrderEntity;

  @Column({nullable:true, type:'boolean', default:false})
  isExpressDelivery : boolean

  @Column({ nullable: true })
  index:number

  //in office order user details 

  @Column({nullable:true})
  name:string

  @Column({nullable:true})
  phoneNumber:string

  @Column({nullable:true})
  email:string

  @Column({nullable:true})
  address:string

  @Column({nullable:true})
  home_apartment_number:string

  @Column({nullable:true})
  area:string

  @Column({nullable:true})
  landmark:string




  // Same fields as CartItemEntity
  @Column()
  parcel_name: string;

  @Column({ type: 'simple-array', nullable: false })
  product_category: string[];

  @Column({ nullable: false })
  quantity: number;

  @Column({ nullable: false })
  parcelWorth: string;

  @Column({ nullable: true })
  weight_of_parcel: string;

  @Column({ nullable: true })
  describe_weight_of_parcel: string;

  @Column({ nullable: true })
  note_for_rider: string;

  @Column({ nullable: true })
  pickup_address: string;

  @Column({ nullable: false })
  pickup_phone_number: string;

  @Column({ nullable: true })
  Area_of_pickup: string;

  @Column({ nullable: true })
  landmark_of_pickup: string;

  @Column({ nullable: false })
  Recipient_name: string;

  @Column({ nullable: false })
  Recipient_phone_number: string;

  @Column({ nullable: false })
  dropOff_address: string;

  @Column({ nullable: true })
  house_apartment_number_of_dropoff: string;

  @Column({ nullable: true })
  Area_of_dropoff: string;

  @Column({ nullable: true })
  landmark_of_dropoff: string;

  @ManyToOne(() => VehicleTypeEntity, (vehicle) => vehicle.selected_vehicle, { cascade: true, onDelete:'SET NULL',nullable:true })
  vehicleType: VehicleTypeEntity;

  @Column({ nullable: false, type: 'enum', enum: PriorityDeliveryType })
  delivery_type: PriorityDeliveryType;

  @Column({ type: 'timestamp', nullable: true })
  schedule_date: Date;

  @Column('numeric', { nullable: true })
  pickupLat: number;

  @Column('numeric', { nullable: true })
  pickupLong: number;

  @Column('numeric', { nullable: true })
  dropOffLat: number;

  @Column('numeric', { nullable: true })
  dropOffLong: number;

  @Column('numeric', { nullable: true })
  distance: number;

  @Column({ nullable: true, type:'boolean', default:false})
  isdroppedOff :boolean;

  @Column({ nullable: true, type:'timestamp' })
  droppedOffAt : Date;
}


//create the ordercart table
@Entity({ name: 'OrderCarts' })
export class OrderCartEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CustomerEntity, (customer) => customer.carts)
  customer: CustomerEntity;

  @ManyToOne(() => AdminEntity, (admin) => admin.carts)
  admin: AdminEntity;

  @OneToMany(() => CartItemEntity, (item) => item.cart)
  items: CartItemEntity[];

  @Column({ nullable: true, type: 'timestamp' })
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  updatedAt: Date;

  @Column({ default: false })
  checkedOut: boolean;
}



// cart item table 
@Entity({ name: 'CartItems' })
export class CartItemEntity {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => OrderCartEntity, (cart) => cart.items)
  cart: OrderCartEntity;

  @Column({ nullable: true })
  index:number

  @Column({nullable:true, type:'boolean', default:false})
  isExpressDelivery : boolean

  @Column({ nullable: true })
  name:string

  @Column({ nullable: true })
  phoneNumber:string

  @Column({ nullable: true })
  email:string

  @Column({ nullable: true })
  address:string

  @Column({ nullable: true })
  home_apartment_number :string

  @Column({ nullable: true })
  area:string

  @Column({ nullable: true })
  landmark:string

  @Column()
  parcel_name: string;

  @Column({ type: 'simple-array', nullable: false })
  product_category: string[];

  @Column({nullable:false})
  quantity: number;

  @Column({nullable:false})
  parcelWorth: string;

  @Column( { nullable: true })
  weight_of_parcel: string;

  @Column({nullable:true})
  describe_weight_of_parcel: string;

  @Column({nullable:true})
  note_for_rider: string;

  @Column({nullable:true})
  pickup_address: string;

  @Column({nullable:false})
  pickup_phone_number: string;

  @Column({nullable:true})
  Area_of_pickup: string;

  @Column({nullable:true})
  landmark_of_pickup: string;

  @Column({nullable:false})
  Recipient_name: string;

  @Column({nullable:false})
  Recipient_phone_number: string;

  @Column({nullable:false})
  dropOff_address: string;

  @Column({nullable:true})
  house_apartment_number_of_dropoff: string;

  @Column({nullable:true})
  Area_of_dropoff: string;

  @Column({nullable:true})
  landmark_of_dropoff: string;

  @ManyToOne(()=>VehicleTypeEntity, vehicle=>vehicle.selected_vehicle, { cascade: true, onDelete:'SET NULL',nullable:true })
  vehicleType: VehicleTypeEntity

  @Column({ nullable: false, type: 'enum', enum: PriorityDeliveryType })
  delivery_type: PriorityDeliveryType;

  @Column({type:'timestamp',nullable:true})
  schedule_date: Date;

  @Column('numeric', { nullable: true })
  pickupLat: number;

  @Column('numeric', { nullable: true })
  pickupLong: number;

  @Column('numeric', { nullable: true })
  dropOffLat: number;

  @Column('numeric', { nullable: true })
  dropOffLong: number;

  @Column('numeric', { nullable: true })
  distance: number;

}


import { CartItemEntity, OrderCartEntity, OrderEntity, OrderItemEntity } from "src/Entity/orders.entity";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(OrderEntity)
export class OrderRepository extends Repository<OrderEntity>{}

@EntityRepository(CartItemEntity)
export class CartItemRepository extends Repository<CartItemEntity>{}


@EntityRepository(OrderCartEntity)
export class OrderCartRepository extends Repository<OrderCartEntity>{}

@EntityRepository(OrderItemEntity)
export class OrderItemRepository extends Repository<OrderItemEntity>{}
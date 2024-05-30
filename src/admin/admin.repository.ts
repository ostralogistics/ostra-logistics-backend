
import { AdminEntity } from "src/Entity/admins.entity";
import { DiscountEntity } from "src/Entity/discount.entity";
import { PriceListEntity } from "src/Entity/pricelist.entity";
import { RepliesEntity } from "src/Entity/replies.entity";
import { VehicleEntity } from "src/Entity/vehicle.entity";
import { VehicleTypeEntity } from "src/Entity/vehicleType.entity";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(AdminEntity)
export class AdminRepository extends Repository<AdminEntity>{}

@EntityRepository(VehicleEntity)
export class VehicleRepository extends Repository<VehicleEntity>{}

@EntityRepository(VehicleTypeEntity)
export class VehicleTypeRepository extends Repository<VehicleTypeEntity>{}

@EntityRepository(RepliesEntity)
export class RepliesRepository extends Repository<RepliesEntity>{}

@EntityRepository(DiscountEntity)
export class DiscountRepository extends Repository<DiscountEntity>{}

@EntityRepository(PriceListEntity)
export class PriceListRepository extends Repository<PriceListEntity>{}



import { AdminEntity } from "src/Entity/admins.entity";
import { RepliesEntity } from "src/Entity/replies.entity";
import { VehicleEntity } from "src/Entity/vehicle.entity";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(AdminEntity)
export class AdminRepository extends Repository<AdminEntity>{}

@EntityRepository(VehicleEntity)
export class VehicleRepository extends Repository<VehicleEntity>{}

@EntityRepository(RepliesEntity)
export class RepliesRepository extends Repository<RepliesEntity>{}
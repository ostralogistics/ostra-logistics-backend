
import { RiderEntity } from "src/Entity/riders.entity";
import { TaskEntity } from "src/Entity/ridersTasks.entity";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(RiderEntity)
export class RidersRepository extends Repository<RiderEntity>{}


@EntityRepository(TaskEntity)
export class TaskRepository extends Repository<TaskEntity>{}
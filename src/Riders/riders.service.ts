import { InjectRepository } from '@nestjs/typeorm';
import { RiderEntity } from 'src/Entity/riders.entity';
import { RidersRepository, TaskRepository } from './riders.repository';
import { OrderEntity } from 'src/Entity/orders.entity';
import { OrderRepository } from 'src/order/order.reposiroty';
import { Notifications } from 'src/Entity/notifications.entity';
import { NotificationRepository } from 'src/common/common.repositories';
import { Mailer } from 'src/common/mailer/mailer.service';
import {
  ConflictException,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { AcceptOrDeclineTaskDto, DropOffCodeDto } from './riders.dto';
import {
  AcceptOrDeclineTask,
  OrderStatus,
  RiderMileStones,
  RiderTask,
  TaskStatus,
} from 'src/Enums/all-enums';
import { TaskEntity } from 'src/Entity/ridersTasks.entity';

export class RiderService {
  constructor(
    @InjectRepository(RiderEntity) private readonly riderRepo: RidersRepository,
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(TaskEntity) private readonly taskRepo: TaskRepository,
    @InjectRepository(Notifications)
    private readonly notificationRepo: NotificationRepository,
    private mailer: Mailer,
  ) {}

  //get orders assigned to him
  async getAllAsignedOrder(Rider: RiderEntity) {
    try {
      const assigned_order = await this.orderRepo.findAndCount({
        where: { Rider: { id: Rider.id } },
        relations: ['Rider', 'customer'],
      });
      if (assigned_order[1] === 0)
        throw new NotFoundException(
          'at the moment you have not been assigned any orders yet',
        );

      return assigned_order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error)
        throw new InternalServerErrorException(
          'Something went wrong when trying to fetch all assigned tasks. Please try again later.',
        );
      }
    }
  }

  //get one order assigned to him
  async getOneAsignedOrder(Rider: RiderEntity, orderID: number) {
    try {
      const assigned_order = await this.orderRepo.findOne({
        where: { Rider: { id: Rider.id }, id: orderID },
        relations: ['Rider', 'customer'],
      });
      if (!assigned_order)
        throw new NotFoundException(
          'at the moment you have not been assigned any orders yet',
        );

      return assigned_order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error)
        throw new InternalServerErrorException(
          'Something went wrong when trying to fetch one assigned task. Please try again later.',
        );
      }
    }
  }

  //accept order or decilne order

  async AcceptOrDeclineAssignedTask(
    dto: AcceptOrDeclineTaskDto,
    Rider: RiderEntity,
    taskID: number,
  ) {
    try {
   
        const task = await this.taskRepo.findOne({
          where: {
            id: taskID,
            rider: { id: Rider.id },
          },
          relations: ['rider', 'assigned_order'],
        });
  
        if (!task)
          throw new NotFoundException(
            `task with the id: ${taskID} is not assigned to this rider`,
          );

      //accept or decline and update the order status
      if (dto && dto.action === AcceptOrDeclineTask.ACCEPT) {
        
        task.rider = Rider;
        task.acceptedAt = new Date(); 
        (task.status = TaskStatus.ONGOING);
        await this.taskRepo.save(task);
        return task;

      } else if (dto && dto.action === AcceptOrDeclineTask.DECLINE) {
        //update the task table
        task.rider = Rider;
        (task.declinedAT = new Date());
        await this.taskRepo.save(task);
      }

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error)
        throw new InternalServerErrorException(
          'something went wrong while trying to accept or decline this task, please try again later',
        );
      }
    }
  }

  //check-in when rider gets to pick up location
  async RiderChecksToPickupLocInWhenHeGetation(
    taskID: number,
    orderID: number,
    Rider: RiderEntity,
  ) {
    try {
      const task = await this.taskRepo.findOne({
        where: {
          id: taskID,
          rider: { id: Rider.id },
          assigned_order: { id: orderID },
        },
        relations: ['rider', 'assigned_order'],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae pickup milestone
      task.milestone = RiderMileStones.AT_PICKUP_LOCATION;
      await this.taskRepo.save(task);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error)
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of reaching the pick up location, please try again later',
        );
      }
    }
  }

  //check in when rider picks up parcel
  async RiderCheckInWhenHePicksUp(
    taskID: number,
    orderID: number,
    Rider: RiderEntity,
  ) {
    try {
      const task = await this.taskRepo.findOne({
        where: {
          id: taskID,
          rider: { id: Rider.id },
        },
        relations: ['rider', 'assigned_order'],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //check the order
      const isOrder = await this.orderRepo.findOne({
        where: {
          id: orderID,
          assigned_task: { id: taskID, rider: { id: Rider.id } },
        },
        relations: ['Rider', 'asssigned_task'],
      });
      if (!isOrder)
        throw new NotAcceptableException(
          'this order you are about to pickup was not assigned to you',
        );

      //updtae pickup milestone
      task.milestone = RiderMileStones.PICKED_UP_PARCEL;
      await this.taskRepo.save(task);

      //update the order table
      isOrder.order_status = OrderStatus.PICKED_UP;
      isOrder.pickupTime = new Date();
      await this.orderRepo.save(isOrder);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof NotAcceptableException) {
        throw new NotAcceptableException(error.message);
      } else {
        console.log(error)
        throw new InternalServerErrorException(
          'something went wrong while trying to update the milestone status of reaching the pickup location, please try again later',
        );
      }
    }
  }

  //check in when he gets to the office

  async RiderCheckInWhenRiderArrivesATTheOfficeForRebranding(
    taskID: number,
    orderID: number,
    Rider: RiderEntity,
  ) {
    try {
      const task = await this.taskRepo.findOne({
        where: {
          id: taskID,
          rider: { id: Rider.id },
          assigned_order: { id: orderID },
        },
        relations: ['rider', 'assigned_order'],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at the office milestone
      task.milestone = RiderMileStones.AT_THE_OFFICE_FOR_REBRANDING;
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error)
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of arriving at the ofice for rebranding, please try again later',
        );
      }
    }
  }

  //when rider arrives at drop off location
  //check-in during pick up
  async RiderCheckInWhenHeGetsToDropoffLocation(
    taskID: number,
    orderID: number,
    Rider: RiderEntity,
  ) {
    try {
      const task = await this.taskRepo.findOne({
        where: {
          id: taskID,
          rider: { id: Rider.id },
          assigned_order: { id: orderID },
        },
        relations: ['rider', 'assigned_order'],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at dropoff location milestone
      task.milestone = RiderMileStones.AT_DROPOFF_LOCATION;
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error)
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of arriving at the droppoff location, please try again later',
        );
      }
    }
  }

  //confirm drop off code when he gets to the drop off and also cirfim drop off
  async RiderCheckInWhenHeDropsOff(
    taskID: number,
    orderID: number,
    Rider: RiderEntity,
    dto: DropOffCodeDto,
  ) {
    try {
      const task = await this.taskRepo.findOne({
        where: {
          id: taskID,
          rider: { id: Rider.id },
        },
        relations: ['rider', 'assigned_order'],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //check the order
      const isOrder = await this.orderRepo.findOne({
        where: {
          id: orderID,
          assigned_task: { id: taskID, rider: { id: Rider.id } },
        },
        relations: ['Rider', 'asssigned_task','customer'],
      });
      if (!isOrder)
        throw new NotAcceptableException(
          'this order you are about to pickup was not assigned to you',
        );

      //confirm dropoff code
      if (dto && dto.dropOff_code !== isOrder.dropoffCode)
        throw new ConflictException(
          'the dropoff code does not match, please try again ',
        );

      //updtae pickup milestone
      task.milestone = RiderMileStones.DROPPED_OFF_PARCEL;
      task.status = TaskStatus.CONCLUDED;
      await this.taskRepo.save(task);

      //update the order table
      isOrder.order_status = OrderStatus.DROPPED_OFF;
      isOrder.pickupTime = new Date();
      await this.orderRepo.save(isOrder);

      //send mail 
      await this.mailer.ParcelDroppedOfMail(isOrder.customer.email,isOrder.customer.firstname,isOrder.trackingID)

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof NotAcceptableException) {
        throw new NotAcceptableException(error.message);
      } else if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      } else {
        console.log(error)
        throw new InternalServerErrorException(
          'something went wrong while trying to update the milestone status for dropping off parcel and concluding your trip, please try again later',
        );
      }
    }
  }

  //see tasks asssigned to the rider
  async fetchAssignedTask(Rider: RiderEntity) {
    try {
      const mytasks = await this.taskRepo.findAndCount({
        where: { rider: { id: Rider.id } },
        relations: ['assigned_order', 'rider'],
      });
  
      if (mytasks[1] === 0)
        throw new NotFoundException('no tasks has been assigned to you yet');
      return mytasks;
    } catch (error) {
      if (error instanceof NotFoundException){
        throw new NotFoundException(error.message)
      }
      else{
        console.log(error)
        throw new InternalServerErrorException('an error occured when trying to fetch your assigned tasks')
      }
      
    }
  }

//fetch one assigned task
  async fetchOneTask(Rider: RiderEntity,taskID:number) {
    try {
      const mytasks = await this.taskRepo.findOne({
        where: { rider: { id: Rider.id },id:taskID },
        relations: ['assigned_order', 'rider'],
      });
  
      if (!mytasks)
        throw new NotFoundException('the task does not exist');
      return mytasks;
    } catch (error) {
      if (error instanceof NotFoundException){
        throw new NotFoundException(error.message)
      }
      else{
        console.log(error)
        throw new InternalServerErrorException('an error occured when trying to fetch your assigned tasks')
      }
      
    }
  }


  //fetch all ongoing tasks 
  async fetchAllOngoingTasks(Rider: RiderEntity) {
    try {
      const mytasks = await this.taskRepo.findAndCount({
        where: { rider: { id: Rider.id }, status:TaskStatus.ONGOING },
        relations: ['assigned_order', 'rider'],
      });
  
      if (mytasks[1] === 0)
        throw new NotFoundException('you have no ongoing tasks at the moment');
      return mytasks;
    } catch (error) {
      if (error instanceof NotFoundException){
        throw new NotFoundException(error.message)
      }
      else{
        console.log(error)
        throw new InternalServerErrorException('an error occured when trying to fetch your ongoing tasks')
      }
      
    }
  }


  async fetchAllConcludedTasks(Rider: RiderEntity) {
    try {
      const mytasks = await this.taskRepo.findAndCount({
        where: { rider: { id: Rider.id }, status:TaskStatus.CONCLUDED },
        relations: ['assigned_order', 'rider'],
      });
  
      if (mytasks[1] === 0)
        throw new NotFoundException('you have no concluded tasks at the moment');
      return mytasks;
    } catch (error) {
      if (error instanceof NotFoundException){
        throw new NotFoundException(error.message)
      }
      else{
        throw new InternalServerErrorException('an error occured when trying to fetch your concluded tasks')
      }
      
    }
  }

  
}

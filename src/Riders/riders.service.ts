import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RiderBankDetailsEntity, RiderEntity } from 'src/Entity/riders.entity';
import {
  RidersRepository,
  TaskRepository,
  riderBankDetailsRepository,
} from './riders.repository';
import { OrderEntity } from 'src/Entity/orders.entity';
import { OrderRepository } from 'src/order/order.reposiroty';
import { Notifications } from 'src/Entity/notifications.entity';
import {
  NotificationRepository,
  RequestRepository,
  TransactionRespository,
} from 'src/common/common.repositories';
import { Mailer } from 'src/common/mailer/mailer.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import {
  AcceptOrDeclineTaskDto,
  CancelRideDto,
  ChangeBankPreferenceDto,
  DropOffCodeDto,
  MakeRequestDto,
  RequestResetPasswordDto,
} from './riders.dto';
import {
  AcceptOrDeclineTask,
  OrderDisplayStatus,
  OrderStatus,
  RequestType,
  RiderMileStones,
  RiderStatus,
  TaskStatus,
  TransactionType,
} from 'src/Enums/all-enums';
import { TaskEntity } from 'src/Entity/ridersTasks.entity';
import { RequestEntity } from 'src/Entity/requests.entity';
import { IOrder } from 'src/order/order';
import { DataSource, ILike, QueryRunner } from 'typeorm';
import { markNotificationAsReadDto } from 'src/customer/customer.dto';
import { EventsGateway } from 'src/common/gateways/websockets.gateway';
import { FcmService } from 'src/firebase/fcm-node.service';
import { TransactionEntity } from 'src/Entity/transactions.entity';


export class RiderService {
  constructor(
   
    @InjectRepository(RiderEntity) private readonly riderRepo: RidersRepository,
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(TaskEntity) private readonly taskRepo: TaskRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    @InjectRepository(RiderBankDetailsEntity)
    private readonly riderbankdetailsRepo: riderBankDetailsRepository,
    @InjectRepository(RequestEntity)
    private readonly requestrepo: RequestRepository,
    private mailer: Mailer,
    private readonly eventsGateway: EventsGateway,
    private readonly fcmService: FcmService,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: TransactionRespository,
    @InjectDataSource() private readonly dataSource: DataSource,
   
    
  ) {}

  //get orders assigned to him
  async getAllAsignedOrder(Rider: RiderEntity) {
    try {
      const assigned_order = await this.orderRepo.findAndCount({
        where: { Rider: { id: Rider.id } },
        relations: ['Rider', 'customer', 'items'],
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
        console.log(error);
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
        relations: ['Rider', 'customer', 'items'],
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
        console.log(error);
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
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });
  
      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );
  
      if (dto.action === AcceptOrDeclineTask.ACCEPT) {
        task.rider = Rider;
        task.acceptedAt = new Date();
        task.status = TaskStatus.ONGOING;
        await this.taskRepo.save(task);
  
        task.assigned_order.order_status = OrderStatus.RIDER_ASSIGNED;
        task.assigned_order.RiderAssignedAT = new Date();
        await this.orderRepo.save(task.assigned_order);
  
        Rider.status = RiderStatus.IN_TRANSIT;
        await this.riderRepo.save(Rider);
  
        const notification = new Notifications();
        notification.account = Rider.riderID;
        notification.subject = 'Rider Accepted a Task !';
        notification.message = `Rider with the id ${Rider.id} has accepted the Task on the ostra logistics rider app`;
        await this.notificationripo.save(notification);
  
        return task;
      } else if (dto.action === AcceptOrDeclineTask.DECLINE) {
        if (!dto.reason) {
          throw new BadRequestException('A reason must be provided when declining a task');
        }
  
        task.rider = Rider;
        task.reason_for_cancelling_declining = dto.reason;
        task.declinedAT = new Date();
        await this.taskRepo.save(task);
  
        const notification = new Notifications();
        notification.account = Rider.riderID;
        notification.subject = 'Rider Declined a Task !';
        notification.message = `Rider  ${Rider.firstname} has declined the Task on the ostra logistics rider app due to this reason ${dto.reason}`;
        await this.notificationripo.save(notification);
  
        return task;
      }
  
      
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to accept or decline this task, please try again later',
        );
      }
    }
  }

  //cancel ride after accepting a task

  async CancelRideOrTask(
    dto: CancelRideDto,
    rider: RiderEntity,
    taskID: number,
  ): Promise<{ message: string; task: TaskEntity }> {
    try {
      const task = await this.taskRepo.findOne({
        where: {
          id: taskID,
          rider: { id: rider.id },
        },
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });

      if (!task) {
        throw new NotFoundException(
          `Task with ID: ${taskID} is not assigned to this rider`,
        );
      }

      if (task.status !== TaskStatus.ONGOING) {
        throw new NotAcceptableException(
          'You cannot cancel a ride you have not accepted. If you do not want to take the ride, please decline instead.',
        );
      }

      // Cancel task and stateason
      task.reason_for_cancelling_ride = dto.reason;
      task.isCancelled = true;
      task.cancelledAt = new Date();
      await this.taskRepo.save(task);

      // Change the status of the order to unassigned for rider and task
      task.assigned_order.Rider = null;
      task.assigned_order.assigned_task = null;
      await this.orderRepo.save(task.assigned_order);

           // Notify admin about the ride cancellation
           this.eventsGateway.notifyCustomer('rideCancelled', {
            message: 'Ride cancelled',
            reason: task.reason_for_cancelling_ride,
            rider: rider,
            task: taskID,
            customerId: task.assigned_order.customer.id,  // Include customer ID
          })

      // Save notification
      const notification = new Notifications();
      notification.account = rider.riderID;
      notification.subject = 'Ride Cancelled';
      notification.message = `Rider ${rider.firstname} has cancelled a ride.`;
      await this.notificationripo.save(notification);

      return { message: 'Ride has been successfully cancelled', task };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof NotAcceptableException
      ) {
        throw error;
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to cancel the ride.',error.message
        );
      }
    }
  }

  
  async fetchAllCanceledRides(rider: RiderEntity): Promise<{ tasks: TaskEntity[]; count: number }> {
    try {
      const [tasks, count] = await this.taskRepo.findAndCount({
        where: { isCancelled: true, rider: { id: rider.id } },
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });
  
      if (count === 0) {
        throw new NotFoundException('No cancelled rides found for this rider');
      }
  
      return { tasks, count };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.error('Error fetching cancelled rides:', error.message);
        throw new InternalServerErrorException('Something went wrong', error.message);
      }
    }
  }
  

  //check-in when rider gets to pick up location
  async RiderCheckswhenEnrouteToPickupLocation(
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
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae pickup milestone
      task.milestone = RiderMileStones.ENROUTE_TO_PICKUP_LOCATION;
      task.enroute_to_pickup_locationAT = new Date();
      task.checkpointStatus = {
        ...task.checkpointStatus,
        enroute_to_pickup_location: true,
      };
      await this.taskRepo.save(task);

      //update order table
      task.assigned_order.order_status = OrderStatus.ENROUTE_TO_PICKUP;
      task.assigned_order.EnrouteToPickupAT = new Date();
      task.assigned_order.order_display_status = OrderDisplayStatus.IN_TRANSIT;
      await this.orderRepo.save(task.assigned_order);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.riderID;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider  ${Rider.firstname} is on is way to the pickup location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to update milestone status of being on your way to the pick up location, please try again later', error.message
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
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae pickup milestone
      task.milestone = RiderMileStones.AT_PICKUP_LOCATION;
      task.at_pickup_locationAT = new Date();
      task.checkpointStatus = {
        ...task.checkpointStatus,
        at_pickup_location: true,
      };
      await this.taskRepo.save(task);

      //update order table
      task.assigned_order.order_status = OrderStatus.AT_PICKUP_LOCATION;
      task.assigned_order.AtThePickUpLocationAT = new Date();
      task.assigned_order.order_display_status = OrderDisplayStatus.IN_TRANSIT;
      await this.orderRepo.save(task.assigned_order);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.riderID;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider  ${Rider.firstname} has gotten to the pickup location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of reaching the pick up location, please try again later',error.message
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
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at the office milestone
      task.milestone = RiderMileStones.PICKED_UP_PARCEL;
      task.picked_up_parcelAT = new Date();
      task.checkpointStatus = {
        ...task.checkpointStatus,
        picked_up_parcel: true,
      };
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      //update order table
      task.assigned_order.order_status = OrderStatus.RIDER_RECEIVE_PARCEL;
      task.assigned_order.RiderRecieveParcelAT = new Date();
      task.assigned_order.order_display_status = OrderDisplayStatus.IN_TRANSIT;
      await this.orderRepo.save(task.assigned_order);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.riderID;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider ${Rider.firstname} has picked up the parcel from the pick up location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof NotAcceptableException) {
        throw new NotAcceptableException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to update the milestone status of reaching the pickup location, please try again later',error.message
        );
      }
    }
  }

  async RiderCheckInWhenRiderEnrouteTotheOfficeForRebranding(
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
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at the office milestone
      task.milestone = RiderMileStones.ENROUTE_TO_THE_OFFICE_FOR_REBRANDING;
      task.enroute_to_office_for_rebrandingAT = new Date();
      task.checkpointStatus = {
        ...task.checkpointStatus,
        enroute_to_office_for_rebranding: true,
      };
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      //update order table
      task.assigned_order.order_status = OrderStatus.ENROUTE_TO_OFFICE;
      task.assigned_order.EnrouteToOfficeAT = new Date();
      task.assigned_order.order_display_status = OrderDisplayStatus.IN_TRANSIT;
      await this.orderRepo.save(task.assigned_order);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.riderID;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider  ${Rider.firstname} has picked up the parcel and is now on his way to the office for rebranding of the picked up parcel `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of being on your way to  the ofice for rebranding, please try again later',error
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
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at the office milestone
      task.milestone = RiderMileStones.AT_THE_OFFICE_FOR_REBRANDING;
      task.at_the_office_for_rebrandingAT = new Date();
      task.checkpointStatus = {
        ...task.checkpointStatus,
        at_the_office_for_rebranding: true,
      };
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      //update rider
      if (task.task === 'pickup') {
        Rider.status = RiderStatus.AVAILABLE;
        await this.riderRepo.save(Rider);
      }

      //update order table
      task.assigned_order.order_status = OrderStatus.ARRIVES_AT_THE_OFFICE;
      task.assigned_order.ArrivesAtTheOfficeAT = new Date();
      task.assigned_order.order_display_status = OrderDisplayStatus.IN_TRANSIT;
      await this.orderRepo.save(task.assigned_order);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.riderID;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider ${Rider.firstname} has arived the office for rebranding of the picked up parcel `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of arriving at the ofice for rebranding, please try again later',error.message
        );
      }
    }
  }

  //when rider is on his way to the dropoff location
  async RiderCheckInWhenHeISEnrouteToDropoffLocation(
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
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at dropoff location milestone
      task.milestone = RiderMileStones.ENROUTE_TO_DROPOFF_LOCATION;
      task.enroute_to_dropoff_locationAT = new Date();
      task.checkpointStatus = {
        ...task.checkpointStatus,
        enroute_to_dropoff_location: true,
      };
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      //update order table
      task.assigned_order.order_status = OrderStatus.ENROUTE_TO_DROPOFF;
      task.assigned_order.EnrouteToDropOffAT = new Date();
      task.assigned_order.order_display_status = OrderDisplayStatus.IN_TRANSIT;
      await this.orderRepo.save(task.assigned_order);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.riderID;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider ${Rider.firstname} is enroute to the drop off location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of being on your way to the droppoff location, please try again later',error.message
        );
      }
    }
  }

  //when rider arrives at drop off location
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
        relations: [
          'rider',
          'assigned_order',
          'assigned_order.items',
          'assigned_order.customer',
          'assigned_order.admin',
          'assigned_order.items.vehicleType'
        ],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at dropoff location milestone
      task.milestone = RiderMileStones.AT_DROPOFF_LOCATION;
      task.at_dropoff_locationAT = new Date();
      task.checkpointStatus = {
        ...task.checkpointStatus,
        at_dropoff_location: true,
      };
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      //update order table
      task.assigned_order.order_status = OrderStatus.RIDER_AT_DROPOFF_LOCATION;
      task.assigned_order.RiderAtDropOffLocationAT = new Date();
      task.assigned_order.order_display_status = OrderDisplayStatus.IN_TRANSIT;
      await this.orderRepo.save(task.assigned_order);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.riderID;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider ${Rider.firstname} has gotten to the drop off location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of arriving at the droppoff location, please try again later',error.message
        );
      }
    }
  }

  //confirm drop off code when he gets to the drop off and also cirfim drop off
  // async RiderCheckInWhenHeDropsOffnew(
  //   taskID: number,
  //   orderID: number,
  //   Rider: RiderEntity,
  //   dto: DropOffCodeDto,
  // ) {
  //   try {
  //     // Fetch the task
  //     const task = await this.taskRepo.findOne({
  //       where: {
  //         id: taskID,
  //         rider: { id: Rider.id },
  //       },
  //       relations: [
  //         'rider',
  //         'assigned_order',
  //         'assigned_order.items',
  //         'assigned_order.customer',
  //         'assigned_order.admin',
  //       ],
  //     });
  
  //     if (!task)
  //       throw new NotFoundException(
  //         `Task with the id: ${taskID} is not assigned to this rider`,
  //       );
  
  //     // Check the order
  //     const isOrder = await this.orderRepo.findOne({
  //       where: {
  //         id: orderID,
  //         assigned_task: { id: taskID, rider: { id: Rider.id } },
  //       },
  //       relations: ['Rider', 'assigned_task', 'customer', 'items'],
  //     });
  //     if (!isOrder)
  //       throw new NotAcceptableException(
  //         'This order you are about to drop off was not assigned to you',
  //       );
  
  //     // Confirm dropoff code
  //     if (dto && dto.dropOff_code !== isOrder.dropoffCode)
  //       throw new ConflictException(
  //         'The dropoff code does not match, please try again ',
  //       );
  
  //     // Get the number of items in the order
  //     const itemsInOrder = isOrder.items.length;
  
  //     if (dto.itemsDroppedOff > itemsInOrder || dto.itemsDroppedOff < 1) {
  //       throw new NotAcceptableException(
  //         `Invalid number of items dropped off. Please select a number between 1 and ${itemsInOrder}`,
  //       );
  //     }
  
  //     // Update item statuses with individual timestamps
  //     const currentTime = new Date();
  //     for (let i = 0; i < dto.itemsDroppedOff; i++) {
  //       const item = isOrder.items[i];
  //       item.isdroppedOff = true;
  //       item.droppedOffAt = currentTime; // Assign the current time to each item
  //       await this.orderRepo.save(item); // Save the updated item
  //     }
  
  //     // Update task milestone and status
  //     task.milestone = RiderMileStones.DROPPED_OFF_PARCEL;
  //     task.dropped_off_parcelAT = currentTime; // Assign the current time to the task dropoff
  //     task.checkpointStatus = {
  //       ...task.checkpointStatus,
  //       'dropped_off-parcel': true,
  //     };
  
  //     // Check if all items are dropped off
  //     if (dto.itemsDroppedOff < itemsInOrder) {
  //       task.status = TaskStatus.ONGOING;
  //       isOrder.order_display_status = OrderDisplayStatus.IN_TRANSIT;
  
  //       // Save notification
  //       const notification = new Notifications();
  //       notification.account = Rider.id;
  //       notification.subject = 'Rider Reached a MileStone!';
  //       notification.message = `Rider  ${Rider.firstname} has dropped off one of the parcels for a multiple order dropoff points.`;
  //       await this.notificationripo.save(notification);
  //     } else {
  //       task.status = TaskStatus.CONCLUDED;
  //       isOrder.order_status = OrderStatus.DELIVERED;
  //       isOrder.order_display_status = OrderDisplayStatus.COMPLETED;
  //       isOrder.DeliveredAT = currentTime; // Assign the current time to the order delivery
  
  //       // Update the rider entity status
  //       Rider.status = RiderStatus.AVAILABLE;
  //       await this.riderRepo.save(Rider);
  
  //       // Save notification
  //       const notification = new Notifications();
  //       notification.account = Rider.id;
  //       notification.subject = 'Rider Reached a MileStone!';
  //       notification.message = `Rider ${Rider.firstname} has dropped off the parcel and has finally completed the task.`;
  //       await this.notificationripo.save(notification);
  //     }
  
  //     await this.taskRepo.save(task);
  //     await this.orderRepo.save(isOrder);
  
  //     // Log the drop-off
  //     // const dropOffLog = new DropOffLogEntity();
  //     // dropOffLog.order = isOrder;
  //     // dropOffLog.rider = Rider;
  //     // dropOffLog.droppedOffAt = currentTime; // Log the current time
  //     // dropOffLog.location = dto.location; // Assuming location is part of the DTO
  //     // await this.dropOffLogRepo.save(dropOffLog);
  
  //     // Determine the email recipient
  //     const email = isOrder.customer?.email || isOrder.items[0]?.email;
  //     const firstName = isOrder.customer?.firstname || isOrder.items[0]?.name;
  
  //     console.log(email, firstName);
  
  //     if (email && firstName) {
  //       // Send mail
  //       try {
  //         await this.mailer.ParcelDroppedOfMail(
  //           email,
  //           firstName,
  //           isOrder.trackingID,
  //         );
  //         console.log(`Email sent successfully to ${email}`);
  //       } catch (mailError) {
  //         console.error(`Failed to send email to ${email}`, mailError);
  //       }
  //     } else {
  //       console.warn('Email or first name not found for sending mail');
  //     }
  
  //     // Send push notification
  //     await this.fcmService.sendNotification(
  //       isOrder.customer.deviceToken,
  //       'Parcel Successfully DroppedOff!',
  //       `Order with ID: ${isOrder.orderID} belonging to ${isOrder.customer.firstname} has been dropped off to the dropoff location and has been confirmed by the recipient. Thank you for choosing Ostra Logistics`,
  //       {
  //         order: isOrder,
  //         orderID: isOrder.orderID,
  //         customerId: isOrder.customer.id,
  //       },
  //     );
  
  //     return task;
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw new NotFoundException(error.message);
  //     } else if (error instanceof NotAcceptableException) {
  //       throw new NotAcceptableException(error.message);
  //     } else if (error instanceof ConflictException) {
  //       throw new ConflictException(error.message);
  //     } else {
  //       console.log(error);
  //       throw new InternalServerErrorException(
  //         'Something went wrong while trying to update the milestone status for dropping off the parcel and concluding your trip. Please try again later.',
  //         error.message,
  //       );
  //     }
  //   }
  // }


  async RiderCheckInWhenHeDropsOffnew5(
    taskID: number,
    orderID: number,
    Rider: RiderEntity,
    dto: DropOffCodeDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const task = await this.getTask(queryRunner, taskID, Rider.id);
      const isOrder = await this.getOrder(queryRunner, orderID, taskID, Rider.id);
  
      this.validateDropOffCode(dto.dropOff_code, isOrder.dropoffCode);
      //this.validateItemCount(dto.itemsDroppedOff, isOrder.items.length);
  
     
    const currentTime = new Date();
    await this.updateItemStatus(queryRunner, isOrder, dto.itemsDroppedOff, currentTime);
    await this.updateTaskAndOrderStatus(queryRunner, task, isOrder, Rider);

      await this.saveNotification(queryRunner, Rider, isOrder,true);
      await this.sendEmailNotification(isOrder, currentTime);
      //await this.sendPushNotification(isOrder);
  
      await queryRunner.commitTransaction();
      return task;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleError(error);
    } finally {
      await queryRunner.release();
    }
  }
  
  private async getTask(queryRunner: QueryRunner, taskID: number, riderID: string) {
    const task = await queryRunner.manager.findOne(TaskEntity, {
      where: { id: taskID, rider: { id: riderID } },
      relations: ['rider', 'assigned_order', 'assigned_order.items', 'assigned_order.customer', 'assigned_order.admin','assigned_order.items.vehicleType']
    });
    if (!task) throw new NotFoundException(`Task with the id: ${taskID} is not assigned to this rider`);
    return task;
  }
  
  private async getOrder(queryRunner: QueryRunner, orderID: number, taskID: number, riderID: string) {
    const isOrder = await queryRunner.manager.findOne(OrderEntity, {
      where: { id: orderID, assigned_task: { id: taskID, rider: { id: riderID } } },
      relations: ['Rider', 'assigned_task', 'customer', 'items'],
    });
    if (!isOrder) throw new NotAcceptableException('This order you are about to drop off was not assigned to you');
    return isOrder;
  }
  
  private validateDropOffCode(providedCode: string, actualCode: string) {
    if (providedCode !== actualCode) {
      throw new ConflictException('The dropoff code does not match, please try again');
    }
  }
  
  
  private async updateItemStatus(queryRunner: QueryRunner, order: OrderEntity, itemId: number, currentTime: Date) {
    const itemToUpdate = order.items.find(item => item.id === itemId);

    if (!itemToUpdate) {
      throw new NotAcceptableException('Item not found in this order.');
    }
  
    if (itemToUpdate.isdroppedOff) {
      throw new NotAcceptableException('This item has already been dropped off.');
    }
  
    // Update the item as dropped off
    itemToUpdate.isdroppedOff = true;
    itemToUpdate.droppedOffAt = currentTime;
  
    await queryRunner.manager.save(itemToUpdate);
  }
  
  private async updateTaskAndOrderStatus(queryRunner: QueryRunner, task: TaskEntity, order: OrderEntity, Rider: RiderEntity) {
    task.milestone = RiderMileStones.DROPPED_OFF_PARCEL;
    task.dropped_off_parcelAT = new Date(); // This is the latest drop-off time
  
    const remainingItems = order.items.filter(item => !item.isdroppedOff).length;
    const allItemsDroppedOff = remainingItems === 0;
  
    if (allItemsDroppedOff) {
      task.status = TaskStatus.CONCLUDED;
      order.order_status = OrderStatus.DELIVERED;
      order.order_display_status = OrderDisplayStatus.COMPLETED;
      order.DeliveredAT = new Date();
      Rider.status = RiderStatus.AVAILABLE;
      await queryRunner.manager.save(Rider);
      console.log(`Updating task ${task.id} to CONCLUDED and order ${order.id} to COMPLETED`);
    } else {
      task.status = TaskStatus.ONGOING;
      order.order_display_status = OrderDisplayStatus.IN_TRANSIT;
      console.log(`Updating task ${task.id} to ONGOING and order ${order.id} to IN_TRANSIT`);
    }
  
    task.checkpointStatus = { ...task.checkpointStatus, 'dropped_off-parcel': true };
  
    await queryRunner.manager.save(task);
    await queryRunner.manager.save(order);
    console.log(`Successfully saved updates for task ${task.id} and order ${order.id}`);
  }


  
  private async saveNotification(queryRunner: QueryRunner, Rider: RiderEntity, order: OrderEntity, isFullyDroppedOff: boolean) {
    const notification = new Notifications();
    notification.account = Rider.riderID;
    notification.subject = 'Rider Reached a MileStone!';
    notification.message = isFullyDroppedOff
      ? `Rider ${Rider.firstname} has dropped off the parcel and has finally completed the task.`
      : `Rider ${Rider.firstname} has dropped off one of the parcels for a multiple order dropoff points.`;
    await queryRunner.manager.save(notification);
  }
  
  private async sendEmailNotification(order: OrderEntity, currentTime: Date) {
    const email = order.customer?.email || order.items[0]?.email;
    const firstName = order.customer?.firstname || order.items[0]?.name;
  
    if (email && firstName) {
      try {
        await this.mailer.ParcelDroppedOfMail(email, firstName, order.trackingID);
        console.log(`Email sent successfully to ${email}`);
      } catch (mailError) {
        console.error(`Failed to send email to ${email}`, mailError);
      }
    } else {
      console.warn('Email or first name not found for sending mail');
    }
  }
  
  // private async sendPushNotification(order: OrderEntity) {
  //   if (order.customer?.deviceToken) {
  //     await this.fcmService.sendNotification(
  //       order.customer.deviceToken,
  //       'Parcel Successfully DroppedOff!',
  //       `Order with ID: ${order.orderID} belonging to ${order.customer.firstname} has been dropped off to the dropoff location and has been confirmed by the recipient. Thank you for choosing Ostra Logistics`,
  //       {
  //         order: order,
  //         orderID: order.orderID,
  //         customerId: order.customer.id,
  //       },
  //     );
  //   }
  // }
  
  private handleError(error: any) {
    if (error instanceof NotFoundException || error instanceof NotAcceptableException || error instanceof ConflictException) {
      throw error;
    } else {
      console.error(error);
      throw new InternalServerErrorException('Something went wrong while processing the drop-off. Please try again later.');
    }
  }



  //see tasks asssigned to the rider
  async fetchAssignedTask(Rider: RiderEntity) {
    try {
      const mytasks = await this.taskRepo.findAndCount({
        where: { rider: { id: Rider.id } },
        relations: [
          'assigned_order',
          'assigned_order.items',
          'assigned_order.items.vehicleType',
          'rider',
          'assigned_order.customer',
          'assigned_order.admin',
        ],
        order:{assignedAT:'DESC'}
      });

      if (mytasks[1] === 0)
        throw new NotFoundException('no tasks has been assigned to you yet');
      return mytasks;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'an error occured when trying to fetch your assigned tasks',
        );
      }
    }
  }

  //fetch one assigned task
  async fetchOneTask(Rider: RiderEntity, taskID: number) {
    try {
      const mytasks = await this.taskRepo.findOne({
        where: { rider: { id: Rider.id }, id: taskID },
        relations: [
          'assigned_order',
          'assigned_order.items',
          'assigned_order.items.vehicleType',
          'assigned_order.customer',
          'assigned_order.admin',
          'rider',
        ],
      });

      if (!mytasks) throw new NotFoundException('the task does not exist');
      return mytasks;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'an error occured when trying to fetch your assigned tasks',error.message
        );
      }
    }
  }

  //fetch all ongoing tasks
  async fetchAllOngoingTasks(Rider: RiderEntity) {
    try {
      const mytasks = await this.taskRepo.findAndCount({
        where: { rider: { id: Rider.id }, status: TaskStatus.ONGOING },
        relations: [
          'assigned_order',
          'assigned_order.items',
          'assigned_order.items.vehicleType',
          'assigned_order.customer',
          'assigned_order.admin',
          'rider',
        ],
        order:{acceptedAt:'DESC'}
      });

      if (mytasks[1] === 0)
        throw new NotFoundException('you have no ongoing tasks at the moment');
      return mytasks;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'an error occured when trying to fetch your ongoing tasks', error.message
        );
      }
    }
  }

  async fetchAllConcludedTasks(Rider: RiderEntity) {
    try {
      const mytasks = await this.taskRepo.findAndCount({
        where: { rider: { id: Rider.id }, status: TaskStatus.CONCLUDED },
        relations: [
          'assigned_order',
          'assigned_order.items',
          'assigned_order.items.vehicleType',
          'assigned_order.customer',
          'assigned_order.admin',
          'rider',
        ],
        order:{acceptedAt:'DESC'}
      });

      if (mytasks[1] === 0)
        throw new NotFoundException(
          'you have no concluded tasks at the moment',
        );
      return mytasks;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'an error occured when trying to fetch your concluded tasks',error.message
        );
      }
    }
  }

  //get all bankdetails
  async GetMyBankDetials(Rider: RiderEntity) {
    try {
      const details = await this.riderbankdetailsRepo.findAndCount({
        where: { owner: { id: Rider.id } },
        relations: ['owner'],
      });

      if (details[1] === 0)
        throw new NotFoundException(
          'you have no bank details registered at the moment',
        );
      return details;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'an error occured when trying to fetch all bank detials associated with this rider',error.message
        );
      }
    }
  }

  //get one bankdetails
  async GetOneBankDetials(detailsId: number, Rider: RiderEntity) {
    try {
      const detail = await this.riderbankdetailsRepo.findOne({
        where: { id: detailsId, owner: { id: Rider.id } },
        relations: ['owner'],
      });

      if (!detail)
        throw new NotFoundException(
          'there is no bank details associted with this Rider',
        );
      return detail;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'an error occured when trying to fetch a bank detial of the selected bank',error.message
        );
      }
    }
  }

  //cange the status of the bank details
  async BankPreferenceStatus(
    detailsId: number,
    Rider: RiderEntity,
    dto: ChangeBankPreferenceDto,
  ) {
    try {
      const detail = await this.riderbankdetailsRepo.findOne({
        where: { id: detailsId, owner: { id: Rider.id } },
        relations: ['owner'],
      });

      if (!detail)
        throw new NotFoundException(
          'there is no bank details associted with this Rider',
        );

      //upgrade the status
      detail.status = dto.preference;
      await this.riderbankdetailsRepo.save(detail);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.riderID;
      notification.subject = `Rider Changed Bank Preference`;
      notification.message = `Rider with the  id ${Rider} has changed his bank payment preference status  to bank details with id ${detailsId} `;
      await this.notificationripo.save(notification);

      return { message: 'prefernce status successfully updated', detail };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'an error occured when trying to chnage the preference status of the bank details selected', error.message
        );
      }
    }
  }

  //request for passsword change
  async RequestBankinfoChange(
    Rider: RiderEntity,
    dto: MakeRequestDto,
  ): Promise<{ message: string }> {
    try {
      //checkemail
      const rider = await this.riderRepo.findOne({
        where: { id: Rider.id },
      });

      if (!rider)
        throw new NotFoundException(
          'this  rider is not found on ostra logistics ',
        );

      // create a new request
      const request = new RequestEntity();
      (request.Rider = rider),
        (request.requestType = RequestType.BANK_DETAILS_CHANGE);
      request.requestedAt = new Date();
      request.body = dto.body;
      await this.requestrepo.save(request);

      //save notification
      const notification = new Notifications();
      notification.account = rider.riderID;
      notification.subject = 'Rider Requested for bank details change!';
      notification.message = `Rider with the  id ${rider.id} has requested for a bank details change `;
      await this.notificationripo.save(notification);

      return {
        message:
          'Your request has been sent, the Admin will review and respond in due time, thank you',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong when trying to request for reset password, please try again later', error.message
        );
      }
    }
  }

  //  track order
  async TrackOrder(keyword: string | any): Promise<IOrder> {
    try {
      //find order
      const trackorder = await this.orderRepo.findOne({
        where: { trackingID: ILike(`%${keyword}`) },
        relations: ['customer', 'bid', 'Rider'],
        cache: false,
        comment:
          'tracking order with the trackingToken generated by the system',
      });
      if (!trackorder)
        throw new NotFoundException(
          `oops! this trackingID ${keyword} is not associated with any order in ostra logistics`,
        );

      return trackorder;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while tracking order, please try again later', error.message
        );
      }
    }
  }

  //scan barcode for an order
  async scanBarcode(barcode: string): Promise<IOrder> {
    try {
      const order = await this.orderRepo.findOne({
        where: { barcodeDigits: barcode },
        relations: ['customer', 'bid'],
        comment: 'finding order with the trackingID scanned from the barcode',
      });
      if (!order)
        throw new NotFoundException(
          `Oops! Order associated with barcode ${barcode} is not found`,
        );

      return order;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while scanning the barcode to get order status, please try again later',error.message
        );
      }
    }
  }

  //get all notifications related to the customer

  async AllNotificationsRelatedToRider(rider: RiderEntity) {
    try {
      const [notification,count] = await this.notificationripo.findAndCount({
        where: { account: rider.riderID },
        order:{date:'DESC'}
      });
      if (count[1] === 0)
        throw new NotFoundException(
          'oops! you have no notifications at this time',
        );

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch notifications',
          error.message,
        );
      }
    }
  }

  //get one notification and mark it as read
  async OpenOneNotificationRelatedTocustomer(
    rider: RiderEntity,
    notificationId: number,
    dto: markNotificationAsReadDto,
  ) {
    try {
      const notification = await this.notificationripo.findOne({
        where: { id: notificationId, account: rider.riderID },
      });
      if (!notification) throw new NotFoundException('notification not found');

      if (dto) {
        notification.isRead = dto.isRead;
        await this.notificationripo.save(notification);
      }

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch one notification',
          error.message,
        );
      }
    }
  }

  //get one notification and mark it as read
  async DeleteOneNotificationRelatedTocustomer(
    rider: RiderEntity,
    notificationId: number,
  ) {
    try {
      const notification = await this.notificationripo.findOne({
        where: { id: notificationId, account: rider.riderID },
      });
      if (!notification) throw new NotFoundException('notification not found');

      await this.notificationripo.remove(notification);
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to delete a notification',
          error.message,
        );
      }
    }
  }
  async fetchRiderPaymentTransactionHistory(rider: RiderEntity) {
    try {
      console.log(`Fetching transactions for rider with ID: ${rider.id}`);
  
      const mytransactions = await this.transactionRepo.findAndCount({
        where: {
          Rider: { id: rider.id },
          transactionType: TransactionType.SALARY_PAYMENT 
        },
        relations: ['Rider', 'bankInfo'],
        order: { transactedAT: 'DESC' },
      });
  
      // console.log(`Found ${mytransactions[1]} transactions`);
  
      // // Log the first few transactions for debugging
      // console.log('Sample transactions:', JSON.stringify(mytransactions[0].slice(0, 3), null, 2));
  
      if (mytransactions[1] === 0) {
        throw new NotFoundException(
          'There are no transaction logs for this rider at the moment',
        );
      }
  
      return mytransactions;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.error('Error in fetchRiderPaymentTransactionHistory:', error);
        throw new InternalServerErrorException(
          'Something went wrong while fetching the logged transactions of this rider',
          error.message,
        );
      }
    }
  }


}

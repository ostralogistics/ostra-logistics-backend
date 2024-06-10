import { InjectRepository } from '@nestjs/typeorm';
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
} from 'src/common/common.repositories';
import { Mailer } from 'src/common/mailer/mailer.service';
import {
  ConflictException,
  Inject,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import {
  AcceptOrDeclineTaskDto,
  ChangeBankPreferenceDto,
  DropOffCodeDto,
  MakeRequestDto,
  RequestResetPasswordDto,
} from './riders.dto';
import {
  AcceptOrDeclineTask,
  OrderStatus,
  RequestType,
  RiderMileStones,
  RiderStatus,
  RiderTask,
  TaskStatus,
} from 'src/Enums/all-enums';
import { TaskEntity } from 'src/Entity/ridersTasks.entity';
import { RequestEntity } from 'src/Entity/requests.entity';
import { IOrder } from 'src/order/order';
import { ILike } from 'typeorm';
import { markNotificationAsReadDto } from 'src/customer/customer.dto';
// import * as admin from 'firebase-admin';
// import { FirebaseService } from 'src/firebase/firebase.service';

export class RiderService {
  constructor(
    //@Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: admin.app.App,
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
    //private firebaseservice: FirebaseService,
  ) {}

  //get orders assigned to him
  async getAllAsignedOrder(Rider: RiderEntity) {
    try {
      const assigned_order = await this.orderRepo.findAndCount({
        where: { Rider: { id: Rider.id } },
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
        task.status = TaskStatus.ONGOING;
        await this.taskRepo.save(task);

        //update rider info 
        Rider.status = RiderStatus.IN_TRANSIT
        await this.riderRepo.save(Rider)


        //save notification
        const notification = new Notifications();
        notification.account = Rider.id;
        notification.subject = 'Rider Accepted a Task !';
        notification.message = `Rider with the  id ${Rider} has accepted the Task on the ostra logistics rider app `;
        await this.notificationripo.save(notification);

        return task;
      } else if (dto && dto.action === AcceptOrDeclineTask.DECLINE) {
        //update the task table
        task.rider = Rider;
        task.declinedAT = new Date();
        await this.taskRepo.save(task);

        //save notification
        const notification = new Notifications();
        notification.account = Rider.id;
        notification.subject = 'Rider Delined a Task !';
        notification.message = `Rider with the  id ${Rider} has declined the Task on the ostra logistics rider app `;
        await this.notificationripo.save(notification);
      }

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to accept or decline this task, please try again later',
        );
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
        relations: ['rider', 'assigned_order'],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae pickup milestone
      task.milestone = RiderMileStones.ENROUTE_TO_PICKUP_LOCATION;
      await this.taskRepo.save(task);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.id;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider with the  id ${Rider} is on is way to the pickup location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of being on your way to the pick up location, please try again later',
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

      //save notification
      const notification = new Notifications();
      notification.account = Rider.id;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider with the  id ${Rider} has gotten to the pickup location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
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
        relations: ['Rider', 'assigned_task'],
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

      //save notification
      const notification = new Notifications();
      notification.account = Rider.id;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider with the  id ${Rider} has picked up the parcel from the pick up location `;
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
          'something went wrong while trying to update the milestone status of reaching the pickup location, please try again later',
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
        relations: ['rider', 'assigned_order'],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at the office milestone
      task.milestone = RiderMileStones.ENROUTE_TO_THE_OFFICE_FOR_REBRANDING;
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.id;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider with the  id ${Rider} has picked up the parcel and is now on his way to the office for rebranding of the picked up parcel `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of being on your way to  the ofice for rebranding, please try again later',
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

      //update rider 
      if (task.task === RiderTask.PICKUP){
        Rider.status = RiderStatus.AVAILABLE
        await this.riderRepo.save(Rider)
      }



      //save notification
      const notification = new Notifications();
      notification.account = Rider.id;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider with the  id ${Rider} has arived the office for rebranding of the picked up parcel `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of arriving at the ofice for rebranding, please try again later',
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
        relations: ['rider', 'assigned_order'],
      });

      if (!task)
        throw new NotFoundException(
          `task with the id: ${taskID} is not assigned to this rider`,
        );

      //updtae at dropoff location milestone
      task.milestone = RiderMileStones.ENROUTE_TO_DROPOFF_LOCATION;
      task.status = TaskStatus.ONGOING;
      await this.taskRepo.save(task);

      //save notification
      const notification = new Notifications();
      notification.account = Rider.id;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider with the  id ${Rider} is enroute to the drop off location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying update milestone status of being on your way to the droppoff location, please try again later',
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

      //save notification
      const notification = new Notifications();
      notification.account = Rider.id;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider with the  id ${Rider} has gotten to the drop off location `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
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
        relations: ['Rider', 'asssigned_task', 'customer'],
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

      //update the rider entity
      Rider.status = RiderStatus.AVAILABLE
      await this.riderRepo.save(Rider)

      //send mail
      await this.mailer.ParcelDroppedOfMail(
        isOrder.customer.email,
        isOrder.customer.firstname,
        isOrder.trackingID,
      );

      //       //send push notification to the customer 
    //       const payload: admin.messaging.MessagingPayload={
    //         notification:{
    //           title:'Order Successfully DroppedOff!',
    //           body:`Order with ID:  ${isOrder.orderID} belonging to  ${isOrder.customer.firstname} has been droppedOff to the dropoff location and has been confirmed by the recipient. Thank you for choosing Ostra Logistics`
    //         }
    //       }
    //       // Retrieve the most recent device token
    //   const recentDeviceToken =
    //   isOrder.customer.deviceToken[isOrder.customer.deviceToken.length - 1];

    // if (recentDeviceToken) {
    //   // Send the push notification to the most recent device token
    //   await this.firebaseservice.sendNotification(
    //     [recentDeviceToken],
    //     payload,
    //   );
    // } else {
    //   console.log('No device token available for the customer.');
    // }

      //save notification
      const notification = new Notifications();
      notification.account = Rider.id;
      notification.subject = 'Rider Reached a MileStone !';
      notification.message = `Rider with the  id ${Rider} has dropped off the prcel and has finally completed that task `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof NotAcceptableException) {
        throw new NotAcceptableException(error.message);
      } else if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      } else {
        console.log(error);
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
        relations: ['assigned_order', 'rider'],
      });

      if (!mytasks) throw new NotFoundException('the task does not exist');
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

  //fetch all ongoing tasks
  async fetchAllOngoingTasks(Rider: RiderEntity) {
    try {
      const mytasks = await this.taskRepo.findAndCount({
        where: { rider: { id: Rider.id }, status: TaskStatus.ONGOING },
        relations: ['assigned_order', 'rider'],
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
          'an error occured when trying to fetch your ongoing tasks',
        );
      }
    }
  }

  async fetchAllConcludedTasks(Rider: RiderEntity) {
    try {
      const mytasks = await this.taskRepo.findAndCount({
        where: { rider: { id: Rider.id }, status: TaskStatus.CONCLUDED },
        relations: ['assigned_order', 'rider'],
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
          'an error occured when trying to fetch your concluded tasks',
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
          'an error occured when trying to fetch all bank detials associated with this rider',
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
          'an error occured when trying to fetch a bank detial of the selected bank',
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
      notification.account = Rider.id;
      notification.subject = `Rider Changed Bank Preference`;
      notification.message = `Rider with the  id ${Rider} has changed his bank payment preference status  to bank details with id ${detailsId} `;
      await this.notificationripo.save(notification);

      return { message: 'prefernce status successfully updated', detail };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'an error occured when trying to chnage the preference status of the bank details selected',
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
      notification.account = rider.id;
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
          'something went wrong when trying to request for reset password, please try again later',
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
            'something went wrong while tracking order, please try again later',
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
            'something went wrong while scanning the barcode to get order status, please try again later',
          );
        }
      }
    }

    //get all notifications related to the customer

  async AllNotificationsRelatedToRider(rider:RiderEntity,) {
    try {
      const notification = await this.notificationripo.findAndCount({
        where: { account: rider.id },
      });
      if (notification[1] === 0)
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
  async OpenOneNotificationRelatedTocustomer(rider:RiderEntity,notificationId:number,dto:markNotificationAsReadDto) {
    try {
      const notification = await this.notificationripo.findOne({
        where: { id:notificationId,account: rider.id },
      });
      if (!notification)
        throw new NotFoundException(
          'notification not found',
        );

        if (dto){
          notification.isRead = dto.isRead
          await this.notificationripo.save(notification)
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
  async DeleteOneNotificationRelatedTocustomer(rider: RiderEntity,notificationId:number) {
    try {
      const notification = await this.notificationripo.findOne({
        where: { id:notificationId,account: rider.id },
      });
      if (!notification)
        throw new NotFoundException(
          'notification not found',
        );

       await this.notificationripo.remove(notification)
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

}

import {
  ConflictException,
  ConsoleLogger,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import { AdminRepository, VehicleRepository } from './admin.repository';
import {
  RegisterVehicleDto,
  ReturnedVehicleDto,
  UpdateVehicleDto,
} from './admin.dto';
import { VehicleEntity } from 'src/Entity/vehicle.entity';
import { UploadService } from 'src/common/helpers/upload.service';
import { RiderEntity } from 'src/Entity/riders.entity';
import { RidersRepository } from 'src/Riders/riders.repository';
import { ReturnedVehicle } from 'src/Enums/all-enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminEntity) private readonly adminRepo: AdminRepository,
    @InjectRepository(VehicleEntity)
    private readonly vehiclerepo: VehicleRepository,
    @InjectRepository(RiderEntity) private readonly riderrepo: RidersRepository,
    private uploadservice: UploadService,
  ) {}

  //register vehicle
  async RegisterVehicle(dto: RegisterVehicleDto, file: Express.Multer.File) {
    try {
      const uploadfile = await this.uploadservice.uploadFile(file);

      const imageurl = `https://localhost:3000/api/v1/ostralogistics/${uploadfile}`;

      const newVehicle = new VehicleEntity();
      newVehicle.color = dto.color;
      newVehicle.registration_number = dto.registration_number;
      newVehicle.state_of_vehicle = dto.state_of_vehicle;
      newVehicle.vehiclePics = imageurl;
      newVehicle.vehicle_model = dto.vehicle_model;
      newVehicle.RegisteredAt = new Date();

      await this.vehiclerepo.save(newVehicle);
      return newVehicle;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while registering a vehicle, please try again later',
      );
    }
  }

  //register vehicle
  async updateVehicle(
    dto: UpdateVehicleDto,
    file: Express.Multer.File,
    vehicleiD: number,
  ) {
    try {
      const vehicle = await this.vehiclerepo.findOne({
        where: { id: vehicleiD },
      });
      if (!vehicle)
        throw new NotFoundException(
          `the vehicle with id ${vehicleiD} does not exist`,
        );

      const uploadfile = await this.uploadservice.uploadFile(file);

      const imageurl = `https://localhost:3000/api/v1/ostralogistics/${uploadfile}`;

      vehicle.color = dto.color;
      vehicle.registration_number = dto.registration_number;
      vehicle.state_of_vehicle = dto.state_of_vehicle;
      vehicle.vehiclePics = imageurl;
      vehicle.vehicle_model = dto.vehicle_model;
      vehicle.UpdatedAt = new Date();

      await this.vehiclerepo.save(vehicle);
      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while updating a vehicle record, please try again later',
        );
      }
    }
  }

  //delete vehicle
  async DeleteVehicle(vehicleID: number) {
    try {
      const vehicle = await this.vehiclerepo.findOne({
        where: { id: vehicleID },
      });
      if (!vehicle)
        throw new NotFoundException(
          `the vehicle with id ${vehicleID} does not exist`,
        );

      //remove the vehicle
      await this.vehiclerepo.remove(vehicle);
      return { message: `vehicle with id ${vehicle}` };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while deleting a vehicle record, please try again later',
        );
      }
    }
  }

  //fetch all vehicle
  async fetchAllVehicle() {
    try {
      const vehicles = await this.vehiclerepo.findAndCount({
        relations: ['assigned_Rider'],
      });
      if (vehicles[1] === 0)
        throw new NotFoundException('there are currently no vehicle records ');

      return vehicles;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while assigning  fetching all vehicles, please try again later',
        );
      }
    }
  }

  //fetch all vehicle
  async fetchOneVehicle(VehicleID) {
    try {
      const vehicles = await this.vehiclerepo.findOne({
        where: { id: VehicleID },
        relations: ['assigned_Rider'],
      });
      if (!vehicles)
        throw new NotFoundException(
          `there are currently no vehicle records with the id ${VehicleID}`,
        );

      return vehicles;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while assigning  fetching all vehicles, please try again later',
        );
      }
    }
  }

  //assign vehicle for a day to a rider

  async assignAVhicleToADriver(riderID: string, vehicleID: number) {
    try {
      const rider = await this.riderrepo.findOne({ where: { id: riderID } });
      if (!rider)
        throw new NotFoundException(
          `rider with id ${riderID}is not found, so this vehilcle cannot be assigned`,
        );

      const vehicle = await this.vehiclerepo.findOne({
        where: { id: vehicleID },
        relations: ['assigned_Rider'],
      });
      if (!vehicle)
        throw new NotFoundException(
          `the vehicle with id ${vehicleID} does not exist`,
        );

      //assingn vehicle
      vehicle.assigned_Rider = rider;
      vehicle.assignedAT = new Date();
      await this.vehiclerepo.save(vehicle);
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while assigning  a vehicle to this rider, please try again later',
        );
      }
    }
  }

  //report when a rider returns back a bike
  async ReportVehicleReturnStatus(
    dto: ReturnedVehicleDto,
    vehicleID: number,
    riderID: string,
  ) {
    try {
      const vehicle = await this.vehiclerepo.findOne({
        where: { id: vehicleID },
        relations: ['assigned_Rider'],
      });
      if (!vehicle)
        throw new NotFoundException(
          `the vehicle with id ${vehicleID} does not exist`,
        );

      const rider = await this.riderrepo.findOne({
        where: { vehicle_for_the_day: vehicle, id: riderID },
      });
      if (!rider)
        throw new ConflictException(
          'this is not same vehicle that was assigned to this driver',
        );

      if (dto && dto.returned === ReturnedVehicle.YES) {
        //report
        vehicle.returned_vehicle = dto.returned;
        vehicle.assigned_Rider = null;
        vehicle.retrnedAt = new Date();
        await this.vehiclerepo.save(vehicle);

        //update the rider db too
        rider.vehicle_for_the_day = null;
        await this.riderrepo.save(rider);
      }

      if (dto && dto.returned === ReturnedVehicle.NOT_YET) {
        vehicle.returned_vehicle = dto.returned;
        vehicle.UpdatedAt = new Date();
        await this.vehiclerepo.save(vehicle);
      }

      return vehicle;
    } catch (error) {
      if (error instanceof ConflictException)
        throw new ConflictException(error.message);
      else if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something happened, while reporting the return status of a vehicle',
        );
      }
    }
  }

  //blog cms
  //create blog
  //delete blog
  //fetch blogs
  //fetch on blog
}

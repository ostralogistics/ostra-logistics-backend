import { Injectable } from '@nestjs/common';

@Injectable()
export class DistanceService {


    // calculate the distance between two points given the parameter of lat and long using the Harvasine Formular 

  public calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const earthRadiusInKm = 6371;
    const dlat = this.degreesToRadians(point2.lat - point1.lat);
    const dlong = this.degreesToRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dlat / 2) * Math.sin(dlat / 2) +
      Math.cos(this.degreesToRadians(point1.lat)) *
        Math.cos(this.degreesToRadians(point2.lat)) *
        Math.sin(dlong / 2) *
        Math.sin(dlong / 2);

    const c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1 - a));
    const distance  = earthRadiusInKm * c
    return distance
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

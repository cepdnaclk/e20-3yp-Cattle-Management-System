import latestSensorData from '../model/latestSensorData';
import geoFenceController = require('../controller/geoFenceController');
import geoFenceModel from '../model/geoFenceModel';

// interface sensorDataInterface {
//   latitude: number;
//   longitude: number;
//   radius: number;
// }

export enum ZoneStatus {
  Safe = 'SAFE',
  Warning = 'WARNING',
  Danger = 'DANGER',
  Unknown = 'UNKNOWN',
}

export class CattleSensorData {
  private static boundaries = {
    heartRate: { min: 60, max: 80 },
    temperature: { min: 37.5, max: 39.5 },
    gpsGeofence: {
      minLatitude: 6.772591,
      maxLatitude: 6.972591,
      minLongitude: 80.697847,
      maxLongitude: 80.897847,
    },
  };

  public static async checkSensors(
    cattleId: number
  ): Promise<{ status: string; action: number[] }> {
    let status: string = 'safe';
    let action: number[] = [];

    const latestData = await latestSensorData.findOne({ deviceId: cattleId });

    if (!latestData) {
      return {
        status: 'unsafe',
        action: [0],
      };
    }

    const cattleData = latestData.toObject();

    if (
      cattleData.heartRate < this.boundaries.heartRate.min ||
      cattleData.heartRate > this.boundaries.heartRate.max
    ) {
      action.push(2);
      status = 'unsafe';
    }

    if (
      cattleData.temperature < this.boundaries.temperature.min ||
      cattleData.temperature > this.boundaries.temperature.max
    ) {
      action.push(3);
      status = 'unsafe';
    }

    // if (cattleData.gpsLocation) {
    //   const { latitude, longitude } = cattleData;
    //   if (
    //     // latitude < this.boundaries.gpsGeofence.minLatitude ||
    //     // latitude > this.boundaries.gpsGeofence.maxLatitude ||
    //     // longitude < this.boundaries.gpsGeofence.minLongitude ||
    //     // longitude > this.boundaries.gpsGeofence.maxLongitude
    //     await this.isCattleInSafeZone()
    //   ) {
    //     action.push(4);
    //     status = 'unsafe';
    //   }
    // }

    if (action.length === 0) {
      return {
        status: 'safe',
        action: [1],
      };
    }

    return {
      status,
      action,
    };
  }

  // Find the distance between 2 points in sphere (Earth)
  private static findDistance = (
    lat1: number,
    lat2: number,
    lng1: number,
    lng2: number
  ) => {
    const radiusOfEath = 6371e3;
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = radiusOfEath * c;

    return distance;
  };

  public static isCattleInSafeZone = async (
    cattleId: number
  ): Promise<ZoneStatus> => {
    const threshold = 4;
    const geoFences = await geoFenceModel.find();
    if (geoFences.length === 0) {
      return ZoneStatus.Safe;
    }

    const latestData = await latestSensorData.findOne({ deviceId: cattleId });
    if (!latestData || !latestData.gpsLocation) {
      return ZoneStatus.Unknown;
    }

    for (const geoFence of geoFences) {
      const distance = this.findDistance(
        latestData.gpsLocation.latitude,
        geoFence.latitude,
        latestData.gpsLocation.longitude,
        geoFence.longitude
      );
      const geoFenceRadius = geoFence.radius;
      // console.log(distance, geoFenceRadius);

      if (distance <= geoFenceRadius) {
        if (distance > geoFenceRadius - threshold) {
          return ZoneStatus.Warning;
        }
        return ZoneStatus.Safe;
      }
    }

    return ZoneStatus.Danger;
  };
}

export interface CattleData {
  cattleId: string;
  cattleName: string;
  createdAt: string;
  cattleStatus: string;
  updatedAt: string;
  heartRate: number;
  temperature: number;
  gpsLocation: {
    latitude: number;
    longitude: number;
  };
}

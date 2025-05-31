import cattle from '../model/cattle';
import sensorData from '../model/sensorData';
import { CattleSensorData } from '../services/controls';
import { mqttClient } from '../services/mqttClient';

module.exports.getAll = async (req: any, res: any) => {
  try {
    let memoryData = mqttClient.getLatestUpdate();
    let sensorDataList: any[] = [];

    if (Object.keys(memoryData).length > 0) {
      // Convert memoryData (object) to array
      sensorDataList = Object.values(memoryData);
    } else {
      // Get the latest record per deviceId from DB
      sensorDataList = await sensorData.aggregate([
        {
          $sort: { createdAt: -1 }, // sort by latest
        },
        {
          $group: {
            _id: '$deviceId',
            doc: { $first: '$$ROOT' }, // get latest per device
          },
        },
        {
          $replaceRoot: { newRoot: '$doc' },
        },
      ]);
    }

    const cattleList = await cattle.find();
    const cattleMap = new Map(cattleList.map((c) => [c.tagId, c]));

    const result = await Promise.all(
      sensorDataList.map(async (sensor) => {
        const deviceId = sensor.deviceId;
        const cattleInfo =
          deviceId !== null && deviceId !== undefined
            ? cattleMap.get(deviceId)
            : undefined;

        const cattleStatus = await CattleSensorData.isCattleInSafeZone(
          deviceId
        );

        return {
          ...sensor,
          cattleId: cattleInfo ? cattleInfo.tagId : null,
          cattleStatus,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cattle data' });
  }
};

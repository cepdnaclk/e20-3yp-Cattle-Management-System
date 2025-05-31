import mqtt, { MqttClient, ISubscriptionGrant } from 'mqtt';
import { SensorDataInterface } from '../types/sensorDataInterface';
import { CattleSensorData } from '../services/controls';
import mongoose from 'mongoose';
import sensorData from '../model/sensorData';
import latestSensorData from '../model/latestSensorData';
import path from 'path';
import fs from 'fs';
// const awsIot = require('aws-iot-device-sdk');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost';

interface CattleData {
  heartRate: number;
  temperature: number;
  deviceId: number;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

class MqttHandler {
  private static instance: MqttHandler;
  private client: MqttClient;
  private isConnected = false;
  private latestupdate: Record<number, CattleData> = {};

  private constructor() {
    //this.client = mqtt.connect(MQTT_BROKER);

    const certsDir = path.join(__dirname, '..', '..', 'certs');

    const options = {
      key: fs.readFileSync(path.join(certsDir, 'private.pem.key')),
      cert: fs.readFileSync(path.join(certsDir, 'certificate.pem.crt')),
      ca: fs.readFileSync(path.join(certsDir, 'AmazonRootCA1.pem')),
      clientId: 'test-client',
      protocol: 'mqtts' as mqtt.MqttProtocol,
      host: 'aoowqlrrhcw8y-ats.iot.eu-north-1.amazonaws.com',
      port: 8883,
      rejectUnauthorized: true,
    };

    this.client = mqtt.connect(options);

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to AWS IoT');
    });

    this.client.on('error', (err) => {
      console.error('MQTT error:', err);
    });

    // this.client.on('connect', () => {
    //     this.isConnected = true;
    //     console.log('Connected to MQTT broker');
    // });

    this.client.on('close', () => {
      this.isConnected = false;
      console.log('Disconnected from MQTT broker');
    });

    // Ensure only ONE message listener is attached globally
    this.client.on('message', async (receivedTopic, message) => {
      try {
        //const data = JSON.parse(message.toString());
        //const receivedMsg: SensorDataInterface = data;
        //const {deviceId, heartRate, temperature, gpsLocation}= receivedMsg;

        const raw = JSON.parse(message.toString());
        console.log(`Received message on topic ${receivedTopic}:`, raw);

        // Map and transform raw fields
        const receivedMsg: SensorDataInterface = {
          deviceId: parseInt(raw.i),
          temperature: parseFloat(raw.t),
          heartRate: parseInt(raw.h),
          gpsLocation:
            raw.la && raw.lo
              ? {
                  latitude: parseFloat(raw.la),
                  longitude: parseFloat(raw.lo),
                }
              : undefined,
        };

        const { deviceId, heartRate, temperature, gpsLocation } = receivedMsg;

        if (deviceId) {
          this.latestupdate[deviceId] = {
            heartRate,
            deviceId,
            temperature,
            gpsLocation,
            timestamp: new Date().toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
            }),
          };
          console.log(
            `Updated data for Cow ${deviceId}:`,
            this.latestupdate[deviceId]
          );

          // Store data in MongoDB
          await this.storeSensorData(
            deviceId,
            heartRate,
            temperature,
            gpsLocation
          );

          // Store latest data in MongoDB
          // const existingData = await latestSensorData.findOne({ deviceId });

          // if (existingData) {
          //   existingData.heartRate = heartRate;
          //   existingData.temperature = temperature;
          //   existingData.gpsLocation = gpsLocation;
          //   //existingData.timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
          //   await existingData.save();
          //   console.log(
          //     `Updated latest sensor data in DB for device ${deviceId}:`
          //   );
          // } else {
          //   await this.storeLatestSensorData(
          //     deviceId,
          //     heartRate,
          //     temperature,
          //     gpsLocation
          //   );
          // }

          // Check alerts and log them
          const { status, action } = await CattleSensorData.checkSensors(
            deviceId
          );

          action.forEach((actionCode: number) => {
            if (actionCode === 0) {
              console.log(status, 'Cattle data not found.');
            } else if (actionCode === 1) {
              console.log(status, 'Cattle is safe and within limits.');
            } else if (actionCode === 2) {
              console.log(status, 'Heart rate is abnormal.');
            } else if (actionCode === 3) {
              console.log(status, 'Temperature is abnormal.');
            } else if (actionCode === 4) {
              console.log(status, 'Cattle is out of the designated area.');
            }
          });
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });
  }

  // Function to store sensor data in MongoDB
  private async storeSensorData(
    deviceId: number,
    heartRate: number,
    temperature: number,
    gpsLocation?: { latitude: number; longitude: number }
  ) {
    try {
      const newSensorData = new sensorData({
        deviceId,
        heartRate,
        temperature,
        gpsLocation,
      });

      await newSensorData.save();
      console.log(`Sensor data stored in DB for device ${deviceId}:`);
    } catch (error) {
      console.error(' Error storing sensor data:', error);
    }
  }

  // Function to store latest sensor data in MongoDB
  // private async storeLatestSensorData(
  //   deviceId: number,
  //   heartRate: number,
  //   temperature: number,
  //   gpsLocation?: { latitude: number; longitude: number }
  // ) {
  //   try {
  //     const newSensorData = new latestSensorData({
  //       deviceId,
  //       heartRate,
  //       temperature,
  //       gpsLocation,
  //     });

  //     await newSensorData.save();
  //     console.log(`Latest Sensor data stored in DB for device ${deviceId}:`);
  //   } catch (error) {
  //     console.error(' Error storing sensor data:', error);
  //   }
  // }

  public static getInstance(): MqttHandler {
    if (!MqttHandler.instance) {
      MqttHandler.instance = new MqttHandler();
    }
    return MqttHandler.instance;
  }

  public getClient(): MqttClient {
    if (!this.isConnected) {
      throw new Error('MQTT client not connected');
    }
    return this.client;
  }

  public publish(
    topic: string,
    message: string,
    options?: mqtt.IClientPublishOptions
  ): void {
    if (!this.isConnected) {
      console.warn(
        `MQTT client not connected. Retrying publishing to ${topic} in 2 seconds.`
      );
      setTimeout(() => this.publish(topic, message, options), 2000);
      return;
    }
    this.client.publish(topic, message, options, (err) => {
      if (err) {
        console.error(`Failed to publish to ${topic}:`, err);
      } else {
        console.log(`Published to ${topic}: ${message}`);
      }
    });
  }

  public subscribe(
    topic: string,
    options?: mqtt.IClientSubscribeOptions
  ): void {
    if (!this.isConnected) {
      console.warn(
        `MQTT client not connected. Retrying subscription to ${topic} in 2 seconds.`
      );
      setTimeout(() => this.subscribe(topic, options), 2000);
      return;
    }

    this.client.subscribe(topic, options, (err, granted) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
        if (granted) {
          granted.forEach((grant) => {
            console.log(`Granted QoS: ${grant.qos} for topic: ${grant.topic}`);
          });
        }
      }
    });
  }

  public getLatestUpdate(): Record<number, CattleData> {
    return this.latestupdate;
  }
}

// Export singleton instance
export const mqttClient = MqttHandler.getInstance();

import mongoose from 'mongoose';

export enum ZoneType {
  SAFE = 'safe',
  DANGER = 'danger',
}

const geoFenceSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  radius: {
    type: Number,
    required: true,
  },
  zoneType: {
    type: String,
    enum: Object.values(ZoneType),
    required: true,
  },
  zoneName: {
    type: String,
    required: true,
    unique: true,
  },
});

const geoFenceModel = mongoose.model('GeoFence', geoFenceSchema);
export default geoFenceModel;

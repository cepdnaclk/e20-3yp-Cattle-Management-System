import geoFenceModel from '../model/geoFenceModel';

module.exports.getAll = async (req: any, res: any) => {
  try {
    const geoFence = await geoFenceModel.find();
    res.status(200).json(geoFence);
  } catch (error: any) {
    res.status(500).json({
      message: 'Error in fetching geo-fence data',
      error: error.message,
    });
  }
};

module.exports.new = async (req: any, res: any) => {
  const { latitude, longitude, radius, zoneType, zoneName } = req.body;
  try {
    const geoFence = new geoFenceModel({
      latitude,
      longitude,
      radius,
      zoneType,
      zoneName,
    });
    await geoFence.save();
    res.status(201).json({ message: 'Geofence created successfully' });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Error in adding geofence', error: error.message });
  }
};

module.exports.deleteGoefence = async (req: any, res: any) => {
  try {
    const geoFence = await geoFenceModel.findOneAndDelete({
      zoneName: req.body.zoneName,
    });
    console.log(geoFence);
    if (!geoFence) {
      return res.status(404).json({ message: 'Geofence not found' });
    }
    res.status(200).json({ message: 'Geofence deleted successfully' });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Error in deleting geofence', error: error.message });
  }
};

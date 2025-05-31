import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import Axios from '../../services/Axios';
import { MdDeleteForever } from 'react-icons/md';
import { FiAlertTriangle } from 'react-icons/fi';

interface geoFenceInterface {
  latitude: number;
  longitude: number;
  radius: number;
  zoneType: string;
  zoneName: string;
}

const DeleteGeoFence = () => {
  const [geoFences, setGeoFences] = useState<geoFenceInterface[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const [selectedGeoFence, setSelectedGeoFence] = useState<geoFenceInterface>();
  const highlightLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const handleRowClick = (geoFence: geoFenceInterface) => {
    setSelectedGeoFence(geoFence);
    highlightGeoFenceOnMap(geoFence);
  };

  // Function to handle circle clicks
  const handleCircleClick = (geoFence: geoFenceInterface) => {
    setSelectedGeoFence(geoFence);
    highlightGeoFenceOnMap(geoFence);
  };

  const highlightGeoFenceOnMap = (geoFence: geoFenceInterface) => {
    // Clear previous highlight
    if (highlightLayerRef.current) {
      highlightLayerRef.current.clearLayers();
    } else {
      highlightLayerRef.current = L.layerGroup().addTo(mapRef.current!);
    }

    const { latitude, longitude, radius } = geoFence;
    L.circle([latitude, longitude], {
      radius,
      color: '#7965C1',
      fillColor: '#8F87F1',
      // color: '#E83F25',
      // fillColor: '#FFAAAA',
      fillOpacity: 0.3,
      weight: 4,
    }).addTo(highlightLayerRef.current);

    // Navigate to the corresponding geo fence selected
    mapRef.current?.panTo([latitude, longitude], {
      animate: true,
      duration: 1,
    });
  };

  const fetchAllGeoFence = async () => {
    try {
      const response = await Axios.get('/geo-fence/');
      const geoFences = response.data;
      setGeoFences(geoFences);
      // Clear existing circles
      circlesRef.current.forEach((circle) => {
        mapRef.current?.removeLayer(circle);
      });
      circlesRef.current = [];

      geoFences.forEach((geoFence: geoFenceInterface) => {
        const { latitude, longitude, radius, zoneType } = geoFence;
        const circle = L.circle([latitude, longitude], {
          radius,
          color: zoneType === 'safe' ? '#1F7D53' : '#E83F25',
          fillColor: zoneType === 'safe' ? '#DDF6D2' : '#FFAAAA',
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(mapRef.current!);

        // Store circle reference
        circlesRef.current.push(circle);

        circle.on('click', () => handleCircleClick(geoFence));
      });
    } catch (error) {
      console.log('Error in fetching data');
    }
  };

  const handleDeleteGeoFence = async (geoFence: geoFenceInterface) => {
    try {
      console.log(geoFence);
      const response = await Axios.delete('/geo-fence/delete', {
        data: geoFence,
      });
      const deleteGeoFence = response.data;
      console.log('Geo fence deleted successfully: ', deleteGeoFence);
      setShowDeletePopup(false);
      setSelectedGeoFence(undefined);
      highlightLayerRef.current?.clearLayers();
      fetchAllGeoFence();
    } catch (error) {
      console.log('Error in deleting geofence');
    }
  };

  useEffect(() => {
    const map = L.map('map').setView([6.872591, 80.797847], 16);
    mapRef.current = map;
    highlightLayerRef.current = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      map
    );

    fetchAllGeoFence();

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="flex space-x-3">
      <div className="relative w-2/7 overflow-hidden">
        {!showDeletePopup ? (
          // GeoFence list table
          <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-4 py-3 w-1/3 text-sm text-start font-semibold uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 w-1/3 text-sm text-start font-semibold uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-3 w-1/3 text-sm text-start font-semibold uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
            </table>

            <div className="overflow-y-auto h-fit">
              <table className="w-full">
                <tbody className="bg-white">
                  {geoFences.map((geoFence: geoFenceInterface) => {
                    const isSelected =
                      geoFence.zoneName === selectedGeoFence?.zoneName;
                    return (
                      <tr
                        onClick={() => handleRowClick(geoFence)}
                        className={`cursor-pointer transition-colors duration-200 ${
                          isSelected
                            ? 'bg-violet-50 border-l-5 border-violet-600'
                            : 'hover:bg-gray-50'
                        }`}>
                        <td className="px-2 py-3 w-1/3 text-start text-sm font-medium text-gray-900">
                          {geoFence.zoneName}
                        </td>
                        <td className="px-4 py-3 w-1/3 text-start text-sm text-gray-600 capitalize">
                          {geoFence.zoneType}
                        </td>
                        <td className="px-8 py-3 w-1/3 text-start">
                          <button
                            onClick={() => {
                              setShowDeletePopup(true);
                            }}
                            className="p-1 rounded-full hover:bg-red-600 transition-colors"
                            aria-label="Delete">
                            <MdDeleteForever className="text-red-600 hover:text-white text-xl" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Delete confirmation popup
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 mt-0.5">
                  <FiAlertTriangle className="h-5 w-6 text-red-500" />
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Delete Geo Fence?
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-500">Zone Name</p>
                    <p className="text-gray-900">
                      {selectedGeoFence?.zoneName}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Zone Type</p>
                    <p className="text-gray-900 capitalize">
                      {selectedGeoFence?.zoneType}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Latitude</p>
                    <p className="text-gray-900">
                      {selectedGeoFence?.latitude}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Longitude</p>
                    <p className="text-gray-900">
                      {selectedGeoFence?.longitude}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Radius</p>
                    <p className="text-gray-900">
                      {selectedGeoFence?.radius} meters
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeletePopup(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-md hover:shadow-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedGeoFence) {
                      handleDeleteGeoFence(selectedGeoFence);
                    }
                  }}
                  className="px-4 py-2 text-white bg-red-600 border border-red-700 hover:shadow-lg hover:bg-red-700 rounded-md">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-[700px] w-5/7 shadow-sm">
        <div id="map" className="h-full w-full rounded-xl" />
      </div>
    </div>
  );
};

export default DeleteGeoFence;

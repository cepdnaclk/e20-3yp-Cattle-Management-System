import { useEffect, useState } from 'react';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import { CattleData } from '../Interface';
import Axios from '../../services/Axios';
import LiveLocationMap from './LiveLocationMap';

const LiveLocation = () => {
  const [allCattleData, setAllCattleData] = useState<CattleData[]>([]);
  const axiosPrivate = UseAxiosPrivate();
  const fetchAllCattle = async () => {
    try {
      const response = await axiosPrivate.get('/map');
      const data = response.data;
      console.log('Response:', data);
      setAllCattleData(data);
    } catch (error) {
      console.error('Error fetching cattle data:', error);
      setAllCattleData([]);
    }
  };
  useEffect(() => {
    fetchAllCattle();
  }, []);

  return (
    <div>
      <div className="h-[450px] border border-gray-400 w-full">
        <LiveLocationMap cattleData={allCattleData} />
      </div>
      <div className="flex justify-evenly space-x-3 mt-3">
        {/* Table for safe cattle */}
        <div className="relative h-[250px] w-full overflow-hidden bg-white shadow-md rounded-lg">
          <div className="bg-green-600 px-4 py-3">
            <h3 className="text-white text-sm font-semibold flex items-center uppercase">
              Cattle in Safe Zone
              <span className="ml-auto bg-green-700 px-2 py-1 rounded-full text-xs">
                {allCattleData.filter((c) => c.cattleStatus === 'SAFE').length}
              </span>
            </h3>
          </div>
          <div className="overflow-y-auto h-full">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {allCattleData
                  .filter((cattle) => cattle.cattleStatus === 'SAFE')
                  .map((cattle) => (
                    <tr
                      key={cattle.cattleId}
                      className="hover:bg-green-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {cattle.cattleId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        ({cattle.gpsLocation.latitude.toFixed(4)},{' '}
                        {cattle.gpsLocation.longitude.toFixed(4)})
                      </td>
                    </tr>
                  ))}
                {allCattleData.filter((c) => c.cattleStatus === 'SAFE')
                  .length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-gray-500">
                      No cattle in safe zone
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table for warning cattle */}
        <div className="relative h-[250px] w-full overflow-hidden bg-white shadow-md rounded-lg">
          <div className="bg-yellow-600 px-4 py-3">
            <h3 className="text-white text-sm font-semibold flex items-center uppercase">
              Cattle in Warning Zone
              <span className="ml-auto bg-yellow-700 px-2 py-1 rounded-full text-xs">
                {
                  allCattleData.filter((c) => c.cattleStatus === 'WARNING')
                    .length
                }
              </span>
            </h3>
          </div>
          <div className="overflow-y-auto h-full">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {allCattleData
                  .filter((cattle) => cattle.cattleStatus === 'WARNING')
                  .map((cattle) => (
                    <tr
                      key={cattle.cattleId}
                      className="hover:bg-yellow-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          {cattle.cattleId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        ({cattle.gpsLocation.latitude.toFixed(4)},{' '}
                        {cattle.gpsLocation.longitude.toFixed(4)})
                      </td>
                    </tr>
                  ))}
                {allCattleData.filter((c) => c.cattleStatus === 'WARNING')
                  .length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-gray-500">
                      No cattle in warning zone
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table for danger cattle */}
        <div className="relative h-[250px] w-full overflow-hidden bg-white shadow-md rounded-lg">
          <div className="bg-red-600 px-4 py-3">
            <h3 className="text-white text-sm font-semibold flex items-center uppercase">
              Cattle in Danger Zone
              <span className="ml-auto bg-red-700 px-2 py-1 rounded-full text-xs">
                {
                  allCattleData.filter((c) => c.cattleStatus === 'DANGER')
                    .length
                }
              </span>
            </h3>
          </div>
          <div className="overflow-y-auto h-full">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {allCattleData
                  .filter((cattle) => cattle.cattleStatus === 'DANGER')
                  .map((cattle) => (
                    <tr
                      key={cattle.cattleId}
                      className="hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {cattle.cattleId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        ({cattle.gpsLocation.latitude.toFixed(4)},{' '}
                        {cattle.gpsLocation.longitude.toFixed(4)})
                      </td>
                    </tr>
                  ))}
                {allCattleData.filter((c) => c.cattleStatus === 'DANGER')
                  .length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-gray-500">
                      No cattle in danger zone
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveLocation;

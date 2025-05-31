import { GiCow } from 'react-icons/gi';
import { IoBatteryHalf } from 'react-icons/io5';
import { AiFillSafetyCertificate } from 'react-icons/ai';
import { MdDangerous } from 'react-icons/md';
import { GoAlertFill } from 'react-icons/go';
import Map from './Map';
import { axiosPrivate } from '../services/Axios';
import { useContext, useEffect, useState } from 'react';
import { CattleData } from './Interface';
import { useNavigate } from 'react-router-dom';
import GlobalContext from '../context/GlobalContext';

const Dashboard = () => {
  const { setCattlelist_selectedOption } = useContext(GlobalContext);
  const [allCattleData, setAllCattleData] = useState<CattleData[]>([]);
  const navigate = useNavigate();

  const fetchAllCattle = async () => {
    try {
      const response = await axiosPrivate.get('/api/sensor/latestWithCattle');
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
    <>
      <div className="absolute top-0 left-0 w-full h-44 bg-green-600 z-0">
        <h1 className="py-7 px-6 text-white text-3xl font-stretch-110% font-bold">
          Welcome to CMS
        </h1>
      </div>
      <div className="px-6 relative z-10 flex h-4/5 justify-evenly mt-28 space-x-6">
        {/* Cattle details summary card */}
        <div className="grid grid-row-4 gap-5 w-2/9">
          <div
            onClick={() => {
              navigate('/livestock');
              setCattlelist_selectedOption('all cattle');
            }}
            className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">Total Cattle</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {allCattleData.length}
              </h3>
            </div>
            <div className="flex-row-reverse">
              <GiCow className="p-3 w-14 h-14 text-gray-600 bg-gray-100 rounded-full" />
            </div>
          </div>
          {/* TODO: Active collars must be get from backend */}
          <div className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">
                Active Collars
              </p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">10</h3>
            </div>
            <div className="flex-row-reverse">
              <IoBatteryHalf className="p-3 w-14 h-14 text-blue-600 bg-blue-100 rounded-full" />
            </div>
          </div>
          <div
            onClick={() => {
              navigate('/livestock');
              setCattlelist_selectedOption('safe');
            }}
            className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">Safe State</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {
                  allCattleData.filter((cattle) => cattle.status === 'safe')
                    .length
                }
              </h3>
            </div>
            <div className="flex-row-reverse">
              <AiFillSafetyCertificate className="p-3 w-14 h-14 text-green-600 bg-green-100 rounded-full" />
            </div>
          </div>
          <div
            onClick={() => {
              navigate('/livestock');
              setCattlelist_selectedOption('alert');
            }}
            className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">Alert State</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {
                  allCattleData.filter((cattle) => cattle.status === 'alert')
                    .length
                }
              </h3>
            </div>
            <div className="flex-row-reverse">
              <GoAlertFill className="p-3 w-14 h-14 text-yellow-600 bg-yellow-100 rounded-full" />
            </div>
          </div>
          <div
            onClick={() => {
              navigate('/livestock');
              setCattlelist_selectedOption('unsafe');
            }}
            className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">Unsafe State</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {
                  allCattleData.filter((cattle) => cattle.status === 'unsafe')
                    .length
                }
              </h3>
            </div>
            <div className="flex-row-reverse">
              <MdDangerous className="p-3 w-14 h-14 text-red-600 bg-red-100 rounded-full" />
            </div>
          </div>
        </div>
        {/* Map */}
        <div
          onClick={() => {
            navigate('/map');
          }}
          className="h-full flex w-7/9">
          <Map />
        </div>
      </div>
    </>
  );
};

export default Dashboard;

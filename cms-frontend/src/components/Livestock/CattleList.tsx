import { useContext, useEffect, useState } from 'react';
import { RiAddCircleLine } from 'react-icons/ri';
import GlobalContext from '../../context/GlobalContext';
import { CattleData } from '../Interface';
import dayjs from 'dayjs';
import { MdDeleteOutline } from 'react-icons/md';
import { MdOutlineEdit } from 'react-icons/md';
import CattleCard from './CattleCard';
import NavSub from '../NavSub';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import AddCattleForm from './AddCattleForm';

const CattleList = () => {
  const {
    showCattleAddForm,
    setShowCattleAddForm,
    showCattleCard,
    setShowCattleCard,
    cattleList_selectedOption,
    setCattlelist_selectedOption,
  } = useContext(GlobalContext);
  const cattleStatus = ['all cattle', 'safe', 'alert', 'unsafe'];
  const [selectedCattleData, setSelectedCattleData] =
    useState<CattleData | null>(null);
  const [filteredCattleData, setFilteredCattleData] = useState<CattleData[]>(
    []
  );

  const displayCattleCard = (cattleData: CattleData) => {
    setSelectedCattleData(cattleData);
    setShowCattleCard(true);
  };

  const addCattleForm = () => {
    setShowCattleAddForm(true);
    console.log(showCattleAddForm);
  };

  const axiosPrivate = UseAxiosPrivate();

  // Fetch and filter all cattle data
  const fetchAndFilter = async () => {
    try {
      const response = await axiosPrivate.get('/api/sensor/latestWithCattle');
      const data = response.data;
      console.log('Response:', data);
      if (cattleList_selectedOption === 'all cattle') {
        setFilteredCattleData(data);
      } else {
        setFilteredCattleData(
          data.filter(
            (cattle: CattleData) =>
              cattle.status.toLowerCase() === cattleList_selectedOption
          )
        );
      }
    } catch (error) {
      console.error('Error fetching cattle data:', error);
      setFilteredCattleData([]);
    }
  };

  useEffect(() => {
    fetchAndFilter();
  }, [cattleList_selectedOption]);

  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-start justify-between mb">
        {/* Navigation to display the livestocks with different status */}
        <NavSub
          options={cattleStatus}
          selectedOption={cattleList_selectedOption}
          onSelect={setCattlelist_selectedOption}
        />

        {/* Add livestock button */}
        <button
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 py-2 px-4 rounded-md text-white text-sm font-medium transition-colors duration-200 shadow-sm w-full sm:w-auto"
          onClick={addCattleForm}>
          <div className="text-lg">
            <RiAddCircleLine />
          </div>
          <div>Add Livestock</div>
        </button>
      </div>
      <hr className="text-gray-300 w-full mb-8" />

      {/* Table to display the livestock details */}
      <table className="w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-md">
        <thead
          className={`${
            cattleList_selectedOption === 'all cattle'
              ? 'bg-gray-700'
              : cattleList_selectedOption === 'safe'
              ? 'bg-green-700'
              : cattleList_selectedOption === 'alert'
              ? 'bg-amber-700'
              : 'bg-red-700'
          }`}>
          <tr>
            {[
              'cattle id',
              'livestock name',
              'added on',
              'current state',
              'last update',
              'action',
            ].map((heading) => (
              <th
                key={heading}
                className="py-4 text-center text-sm font-medium text-white uppercase tracking-wider">
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100">
          {filteredCattleData.length > 0 ? (
            filteredCattleData
              .sort((a, b) => Number(a.cattleId) - Number(b.cattleId))
              .map((cattleData: CattleData) => (
                <tr
                  key={cattleData.cattleId}
                  onClick={() => displayCattleCard(cattleData)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="py-3 text-center text-sm font-medium text-gray-900">
                    {cattleData.cattleId}
                  </td>

                  <td className="py-3 text-center text-sm text-gray-900">
                    {cattleData.cattleName}
                  </td>

                  <td className="py-3 text-center text-sm text-gray-500">
                    {dayjs(cattleData.createdAt).format('MMM D, YYYY h:mm A')}
                  </td>

                  <td className="py-3 text-center ">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cattleData.status === 'safe'
                          ? 'bg-green-100 text-green-800'
                          : cattleData.status === 'alert'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                      {cattleData.status.charAt(0).toUpperCase() +
                        cattleData.status.slice(1)}
                    </span>
                  </td>

                  <td className="py-3 text-center text-sm text-gray-500">
                    {dayjs(cattleData.updatedAt).format('MMM D, YYYY h:mm A')}
                  </td>

                  <td className="py-3 text-sm font-medium ">
                    <div className="flex justify-center space-x-3">
                      <button className="text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-1">
                        <MdOutlineEdit className="text-lg" />
                      </button>
                      <button className="text-red-600 hover:bg-red-600 hover:text-white rounded-full p-1">
                        <MdDeleteOutline className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
          ) : (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-3 text-center text-sm text-gray-500">
                No cattle are in {cattleList_selectedOption.toUpperCase()}{' '}
                region
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showCattleAddForm && <AddCattleForm />}
      {showCattleCard && <CattleCard cattleData={selectedCattleData} />}
    </div>
  );
};

export default CattleList;

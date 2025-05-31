import { useState } from 'react';
import { FieldValue, useForm, FieldValues } from 'react-hook-form';
import dayjs from 'dayjs';
import { CattleData } from '../Interface';

interface CattleCardProps {
  cattleData: CattleData | null;
}

const CattleCard = (cattleData: CattleCardProps) => {
  const [currentMenu, setCurrentMenu] = useState('overview');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <div className="absolute inset-0 bg-gray-50">
      <div className="mt-12 overflow-x-auto px-5">
        <h2 className="text-lg text-gray-700 font-semibold">
          {cattleData.cattleData?.cattleName}
        </h2>
        <div className="flex items-start justify-between">
          {/* Navigation to display the livestocks with different status */}
          <nav>
            <ul className="flex items-center justify-start">
              {['overview', 'health', 'location', 'alerts'].map((menu) => (
                <li
                  key={menu}
                  className={`p-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:border-b-green-700 border-2 border-transparent cursor-pointer
                ${
                  menu === currentMenu
                    ? 'text-green-700 border-b-green-700'
                    : 'text-gray-600'
                }`}
                  onClick={() => setCurrentMenu(menu)}>
                  {menu.toUpperCase()}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {/* Cattle Information Section */}
        <hr className="border-gray-300 w-full mb-8" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-6">
          {/* Cattle Info Card */}
          <div className="w-full md:w-1/2 h-96 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h1 className="text-xl font-semibold text-gray-800 mb-4">
              Cattle Information
            </h1>
            <div className="text-gray-700 text-md">
              <p>
                <span className="font-medium">Cattle ID:</span>{' '}
                {cattleData.cattleData?.cattleId}
              </p>
              <p>
                <span className="font-medium">Cattle Name:</span>{' '}
                {cattleData.cattleData?.cattleName}
              </p>
            </div>
          </div>

          {/* Cattle Status Card */}
          <div className="w-full md:w-1/2 h-96 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-semibold text-gray-800">
                Cattle Status
              </h1>
            </div>
            <div className="text-gray-700 text-md space-y-2">
              <p>
                <span className="font-medium">Last update:</span>{' '}
                {dayjs(cattleData.cattleData?.updatedAt).format(
                  'DD/MM/YYYY HH:mm'
                )}
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                {cattleData.cattleData?.status}
              </p>
              <p>
                <span className="font-medium">Heart Rate:</span>{' '}
                {cattleData.cattleData?.heartRate} bpm
              </p>
              <p>
                <span className="font-medium">Temperature:</span>{' '}
                {cattleData.cattleData?.temperature}°C
              </p>
              <p>
                <span className="font-medium">Location:</span> (
                {cattleData.cattleData?.gpsLocation.longitude},{' '}
                {cattleData.cattleData?.gpsLocation.latitude})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CattleCard;

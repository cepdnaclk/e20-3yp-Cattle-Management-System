import { useState } from 'react';
import NavSub from '../NavSub';
import LiveLocation from './LiveLocation';

const MapPage = () => {
  const mapOptions = ['live location', 'settings'];
  const [selectedOption, setSelectedOption] = useState('live location');

  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-center justify-between mb">
        {/* Navigation to display the different map options */}
        <NavSub
          options={mapOptions}
          selectedOption={selectedOption}
          onSelect={setSelectedOption}
        />
      </div>
      <hr className="text-gray-300 w-full mb-8" />
      {selectedOption === 'live location' && <LiveLocation />}
      {/* {selectedOption === 'settings' && } */}
    </div>
  );
};

export default MapPage;

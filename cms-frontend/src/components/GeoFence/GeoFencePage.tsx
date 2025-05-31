import { useState } from 'react';
import NavSub from '../NavSub';
import AddGeoFence from './AddGeoFence';
import DeleteGeoFence from './DeleteGeoFence';

const GeoFencePage = () => {
  const geoFenceOptions = ['add geo fence', 'delete geo fence'];
  const [selectedOption, setSelectedOption] = useState('add geo fence');
  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-center justify-between mb">
        {/* Navigation to display the different map options */}
        <NavSub
          options={geoFenceOptions}
          selectedOption={selectedOption}
          onSelect={setSelectedOption}
        />
      </div>
      <hr className="text-gray-300 w-full mb-8" />
      {selectedOption === 'add geo fence' && <AddGeoFence />}
      {selectedOption === 'delete geo fence' && <DeleteGeoFence />}
    </div>
  );
};

export default GeoFencePage;

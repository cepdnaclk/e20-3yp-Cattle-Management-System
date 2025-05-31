
import { useContext, useState } from 'react';
import NotificationIcon from './NotificationIcon';
import NotificationDropDown from './NotificationDropDown';
import { FaCircleUser } from 'react-icons/fa6';
import GlobalContext from '../context/GlobalContext';

const TopNav = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { selectedMenu } = useContext(GlobalContext);

  return (
    <div className="flex flex-row h-1/12 bg-white border-b-2 border-gray-200 justify-between items-center z-10">
      <h1 className="ml-7 font-stretch-110% font-bold text-2xl text-green-800">
        {selectedMenu}
      </h1>
      <div className="flex justify-center items-center gap-9 mr-10">
        <div
          className="relative p-2 rounded-2xl"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <NotificationIcon count={120} />
          {isHovered && <NotificationDropDown />}
        </div>
        <FaCircleUser className="h-8 w-8 text-gray-800 hover:text-green-600" />
      </div>
    </div>
  );
};

export default TopNav;

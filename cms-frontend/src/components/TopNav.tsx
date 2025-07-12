import { useContext, useState, useEffect, useRef } from "react";
import NotificationIcon from "./NotificationIcon";
import NotificationDropDown from "./NotificationDropDown";
import { FaCircleUser } from "react-icons/fa6";
import GlobalContext from "../context/GlobalContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";

export interface Notification {
  deviceId: number;
  heartRate: number;
  temperature: number;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  status: string;
  timestamp: string;
}

const TopNav = () => {
  const [isClicked, setIsClicked] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { selectedMenu } = useContext(GlobalContext);
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const navigate = useNavigate();

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsClicked(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-row h-1/12 bg-white border-b-2 border-gray-200 justify-between items-center z-50 relative">
      <h1 className="ml-7 font-stretch-110% font-bold text-2xl text-green-800">
        {selectedMenu}
      </h1>
      <div className="flex justify-center items-center gap-9 mr-10">
        <div
          ref={notificationRef}
          className="relative p-2 rounded-2xl"
          onClick={() => setIsClicked((prev) => !prev)}
        >
          <NotificationIcon count={unreadCount} />
          {isClicked && (
            <NotificationDropDown
              onNotificationClick={(n) => {
                setIsClicked(false);
                navigate(`/alerts/${n._id}`);
              }}
            />
          )}
        </div>
        <FaCircleUser
          className="h-8 w-8 text-gray-800 hover:text-green-600"
          onClick={() => navigate("/profile")}
        />
      </div>
    </div>
  );
};

export default TopNav;

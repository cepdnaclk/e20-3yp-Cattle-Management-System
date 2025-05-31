import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Map = () => {
  useEffect(() => {
    // Initialize the map
    const map = L.map('map').setView([6.872591, 80.797847], 16); // Default view (Coordinate, zoom)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      map
    );

    // Fetch GPS data from backend
    fetch('http://localhost:5000/api/sensor/location')
      .then((response) => response.json())
      .then((data) => {
        Object.keys(data).forEach((key) => {
          const value = data[key];
          const marker = L.marker([
            value.gpsLocation.latitude,
            value.gpsLocation.longitude,
          ]).addTo(map);
          marker.bindPopup(
            `<b>Cattle ID: ${key}</b><br>Lat: ${value.gpsLocation.latitude}, Lon: ${value.gpsLocation.longitude}<br> Timestamp: ${value.timestamp}`
          );
        });
      })
      .catch((error) => console.error('Error fetching GPS data:', error));

    return () => {
      map.remove();
    };
  }, []);

  return <div id="map" className="h-full w-full rounded-2xl" />;
};

export default Map;

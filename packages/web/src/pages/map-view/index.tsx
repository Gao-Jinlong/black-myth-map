import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useContext, useEffect, useRef } from 'react';
import mapContext from '../../context/MapContext';

const MapView = () => {
  const { setMap, CRS } = useContext(mapContext);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const map = L.map(container.current!, {
      center: [51.505, -0.09],
      zoom: 13,
      preferCanvas: true,
      // crs: CRS,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(
      map,
    );

    L.marker([51.5, -0.09])
      .addTo(map)
      .bindPopup('A pretty CSS popup.<br> Easily customizable.')
      .openPopup();

    setMap(map);

    return () => {
      map.remove();
    };
  }, [setMap]);

  return (
    <div className="h-screen w-screen">
      <div ref={container} className="w-full h-full" />
    </div>
  );
};

export default MapView;

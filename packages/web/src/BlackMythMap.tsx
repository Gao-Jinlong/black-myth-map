import { MapProvider } from './context/MapContext';
import './index.css';
import MapView from './pages/map-view';
const BlackMythMap = () => {
  return (
    <>
      <MapProvider>
        <MapView />
      </MapProvider>
    </>
  );
};

export default BlackMythMap;

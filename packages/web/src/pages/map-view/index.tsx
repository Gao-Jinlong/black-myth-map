import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useContext, useEffect, useRef } from "react";
import mapContext from "../../context/MapContext";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: "assets/icon_transport.png",
  iconSize: [60, 60],
});

const MapView = () => {
  const { setMap, CRS } = useContext(mapContext);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = L.map(container.current!, {
      center: [0, 0],
      maxBounds: [
        [-500, -500],
        [500, 500],
      ],
      zoom: 0,
      maxZoom: 12,
      preferCanvas: true,
      crs: CRS,
      attributionControl: false,
    });

    L.imageOverlay("assets/black_myth_01.jpg", [
      [-500, -500],
      [500, 500],
    ]).addTo(map);

    L.marker([-500, -500], {}).addTo(map);
    L.marker([0, 0], {}).addTo(map);
    L.marker([500, 500], {}).addTo(map);

    setMap(map);

    return () => {
      map.remove();
    };
  }, [CRS, setMap]);

  return (
    <div className="h-screen w-screen">
      <div ref={container} className="w-full h-full" />
    </div>
  );
};

export default MapView;

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useContext, useEffect, useRef } from "react";
import mapContext from "../../context/MapContext";
import { useSearchParams } from "react-router-dom";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: "assets/icon_transport.png",
  iconSize: [60, 60],
});

const MapView = () => {
  const { setMap, CRS } = useContext(mapContext);
  const container = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const map = L.map(container.current!, {
      center: [0, 0],
      maxBounds: [
        [0, 0],
        [256, 256],
      ],
      zoom: 0,
      maxZoom: 6,
      preferCanvas: true,
      crs: CRS,
      attributionControl: false,
    });

    L.tileLayer("assets/tile/black_myth_02/{z}/tile_{z}_{y}_{x}.webp", {
      minZoom: 0,
      maxNativeZoom: 3,
      tileSize: 256,
      tms: true,
      bounds: [
        [0, 0],
        [256, 256],
      ],
    }).addTo(map);

    L.marker([256, 256], {}).addTo(map);
    L.marker([0, 0], {}).addTo(map);
    L.marker([128, 128], {}).addTo(map);

    setMap(map);

    map.on("zoomend", () => {
      const param = new URLSearchParams();
      param.set("z", map.getZoom().toString());
      param.set("x", map.getCenter().lng.toString());
      param.set("y", map.getCenter().lat.toString());

      setParams(param);
    });

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

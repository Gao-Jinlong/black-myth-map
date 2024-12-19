import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useContext, useEffect, useRef } from "react";
import mapContext from "../../context/MapContext";
import { useSearchParams } from "react-router-dom";
import MapSelect from "./components/map-select";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: "assets/icon_transport.png",
  iconSize: [60, 60],
});

const MapView = () => {
  const { setMap, tile, CRS } = useContext(mapContext);
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
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

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [CRS, setMap]);

  useEffect(() => {
    if (!mapRef.current) return;
    const t = L.tileLayer(tile.url, {
      minZoom: 0,
      maxNativeZoom: 3,
      tileSize: 256,
      tms: true,
      bounds: [
        [0, 0],
        [256, 256],
      ],
    }).addTo(mapRef.current);
    tileLayerRef.current = t;
    return () => {
      t.removeFrom(mapRef.current!);
    };
  }, [tile]);

  return (
    <div className="h-screen w-screen">
      <MapSelect />

      <div ref={container} className="w-full h-full" />
    </div>
  );
};

export default MapView;

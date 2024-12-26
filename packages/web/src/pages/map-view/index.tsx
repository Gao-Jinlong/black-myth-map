import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useContext, useEffect, useRef } from "react";
import mapContext from "../../context/MapContext";
import { useSearchParams } from "react-router-dom";
import MapSelect from "./components/map-select";
import "./map-view.css";
import LayerControl from "./components/layer-control";
import MapLayers from "./components/map-layers";
import HeatmapLayer from "./components/heatmap-layer";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: "assets/icon_transport.png",
  iconSize: [60, 60],
});

const MapView = () => {
  const { map, setMap, tile, CRS } = useContext(mapContext);
  const container = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const map = L.map(container.current!, {
      center: [0, 0],
      maxBounds: [
        [0, 0],
        [256, 256],
      ],
      zoom: 3,
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

    return () => {
      map.remove();
    };
  }, [CRS, setMap]);

  useEffect(() => {
    if (!map) return;
    const t = L.tileLayer(tile.url, {
      minZoom: 0,
      maxNativeZoom: 3,
      tileSize: 256,
      tms: true,
      bounds: [
        [0, 0],
        [256, 256],
      ],
    }).addTo(map);
    tileLayerRef.current = t;
    return () => {
      t.removeFrom(map);
    };
  }, [map, tile]);

  return (
    <div className="h-screen w-screen bg-slate-950">
      <MapSelect />
      <LayerControl />
      <MapLayers />
      <HeatmapLayer />
      <div ref={container} className="w-full h-full" />
    </div>
  );
};

export default MapView;

import L from "leaflet";
import { useContext, useEffect, useRef } from "react";
import mapContext from "../../../context/MapContext";
import { mapLayers } from "../config/layers";

const MapLayers = () => {
  const { map } = useContext(mapContext);
  const layersRef = useRef<Record<string, L.ImageOverlay>>({});

  useEffect(() => {
    if (!map) return;

    // 添加所有图层
    mapLayers.forEach((layer) => {
      const imageOverlay = L.imageOverlay(
        layer.imageUrl,
        layer.bounds as L.LatLngBoundsExpression,
        {
          opacity: layer.opacity,
        },
      ).addTo(map);
      layersRef.current[layer.id] = imageOverlay;
    });

    // 监听图层可见性变化事件
    const handleVisibilityChange = (
      event: CustomEvent<{ visibleLayers: string[] }>,
    ) => {
      const visibleLayers = new Set(event.detail.visibleLayers);

      Object.entries(layersRef.current).forEach(([layerId, layer]) => {
        if (visibleLayers.has(layerId)) {
          layer.addTo(map);
        } else {
          layer.removeFrom(map);
        }
      });
    };

    window.addEventListener(
      "layerVisibilityChange",
      handleVisibilityChange as EventListener,
    );

    // 清理函数
    return () => {
      Object.values(layersRef.current).forEach((layer) => layer.remove());
      window.removeEventListener(
        "layerVisibilityChange",
        handleVisibilityChange as EventListener,
      );
    };
  }, [map]);

  return null;
};

export default MapLayers;

import { useContext, useEffect, useState } from "react";
import mapContext from "../../../context/MapContext";

const LayerControl = () => {
  const { tile } = useContext(mapContext);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(tile.layers?.map((layer) => layer.id) || []),
  );

  const toggleLayer = (layerIds: string[]) => {
    setVisibleLayers(new Set(layerIds));

    // 触发自定义事件，通知 MapLayers 组件更新图层
    const event = new CustomEvent("layerVisibilityChange", {
      detail: { visibleLayers: layerIds },
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    if (!tile.layers?.length) {
      toggleLayer([]);
    } else {
      toggleLayer(tile.layers.map((layer) => layer.id));
    }
  }, [tile]);

  return (
    tile.layers?.length && (
      <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-md z-[500]">
        <h3 className="text-lg font-bold mb-2">图层控制</h3>
        {tile.layers.map((layer) => (
          <div key={layer.id} className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              id={layer.id}
              checked={visibleLayers.has(layer.id)}
              onChange={() => toggleLayer(layer.id)}
            />
            <label htmlFor={layer.id}>{layer.name}</label>
          </div>
        ))}
      </div>
    )
  );
};

export default LayerControl;

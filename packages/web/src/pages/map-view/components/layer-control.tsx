import { useContext, useState } from "react";
import { mapLayers } from "../config/layers";
import mapContext from "../../../context/MapContext";

const LayerControl = () => {
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(mapLayers.map((layer) => layer.id)),
  );
  const { map } = useContext(mapContext);

  const toggleLayer = (layerId: string) => {
    const newVisibleLayers = new Set(visibleLayers);
    if (newVisibleLayers.has(layerId)) {
      newVisibleLayers.delete(layerId);
    } else {
      newVisibleLayers.add(layerId);
    }
    setVisibleLayers(newVisibleLayers);

    // 触发自定义事件，通知 MapLayers 组件更新图层
    const event = new CustomEvent("layerVisibilityChange", {
      detail: { visibleLayers: Array.from(newVisibleLayers) },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-md z-[500]">
      <h3 className="text-lg font-bold mb-2">图层控制</h3>
      {mapLayers.map((layer) => (
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
  );
};

export default LayerControl;

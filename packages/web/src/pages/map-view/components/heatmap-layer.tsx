import { useContext, useEffect, useRef, useState } from "react";
import L from "leaflet";
import mapContext from "../../../context/MapContext";
import { Kriging } from "../../../utils/kriging";

// 定义散点数据类型
interface ScatterPoint {
  lat: number;
  lng: number;
  value: number;
}

// 配置常量
const HEATMAP_CONFIG = {
  resolution: 100, // 插值网格分辨率
  variogram: "gaussian", // 变差函数类型
  sigma2: 1, // 变差函数参数
  alpha: 50, // 变差函数范围参数
  colorStops: [
    { value: 0, color: [0, 0, 255] }, // 蓝色
    { value: 0.5, color: [0, 255, 0] }, // 绿色
    { value: 1, color: [255, 0, 0] }, // 红色
  ],
  opacity: 0.7,
  mockPointCount: 30,
};

// 生成 mock 散点数据的函数
const generateMockScatterData = (
  count: number = HEATMAP_CONFIG.mockPointCount,
): ScatterPoint[] => {
  const points: ScatterPoint[] = [];
  const mapBounds = {
    minLat: 0,
    maxLat: 256,
    minLng: 0,
    maxLng: 256,
  };

  for (let i = 0; i < count; i++) {
    points.push({
      lat:
        mapBounds.minLat +
        Math.random() * (mapBounds.maxLat - mapBounds.minLat),
      lng:
        mapBounds.minLng +
        Math.random() * (mapBounds.maxLng - mapBounds.minLng),
      value: Math.random(),
    });
  }

  return points;
};

// 颜色插值函数
const interpolateColor = (value: number): [number, number, number] => {
  const { colorStops } = HEATMAP_CONFIG;

  // 找到value所在的区间
  let startIndex = 0;
  for (let i = 1; i < colorStops.length; i++) {
    if (value <= colorStops[i].value) {
      startIndex = i - 1;
      break;
    }
  }

  const start = colorStops[startIndex];
  const end = colorStops[startIndex + 1];
  const t = (value - start.value) / (end.value - start.value);

  return [
    Math.round(start.color[0] + (end.color[0] - start.color[0]) * t),
    Math.round(start.color[1] + (end.color[1] - start.color[1]) * t),
    Math.round(start.color[2] + (end.color[2] - start.color[2]) * t),
  ];
};

const HeatmapLayer = () => {
  const { map } = useContext(mapContext);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasOverlayRef = useRef<L.Layer | null>(null);
  const [scatterData, setScatterData] = useState<ScatterPoint[]>([]);

  useEffect(() => {
    // 初始化 mock 数据
    setScatterData(generateMockScatterData());
  }, []);

  useEffect(() => {
    if (!map) return;

    // 创建 canvas 元素
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvasRef.current = canvas;

    // 创建自定义图层
    const canvasOverlay = L.Layer.extend({
      onAdd: function (map: L.Map) {
        const size = map.getSize();
        canvas.width = size.x;
        canvas.height = size.y;
        map.getPanes().overlayPane.appendChild(canvas);
      },

      onRemove: function (map: L.Map) {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      },

      drawLayer: function () {
        const bounds = map.getBounds();
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 清除之前的绘制内容
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 准备插值数据
        const points = scatterData.map((point) => ({
          x: point.lng,
          y: point.lat,
          value: point.value,
        }));

        if (points.length < 3) return; // 至少需要3个点才能进行插值

        // 创建图像数据
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const { resolution, variogram, sigma2, alpha, opacity } =
          HEATMAP_CONFIG;

        // 计算网格步长
        const stepX = canvas.width / resolution;
        const stepY = canvas.height / resolution;

        // 对每个网格点进行插值
        for (let i = 0; i < resolution; i++) {
          for (let j = 0; j < resolution; j++) {
            const pixelX = i * stepX;
            const pixelY = j * stepY;
            const latlng = map.containerPointToLatLng([pixelX, pixelY]);

            // 使用 kriging 进行插值
            const value = Kriging.interpolate(
              points,
              latlng.lng,
              latlng.lat,
              variogram,
              sigma2,
              alpha,
            );

            // 获取插值点的颜色
            const [r, g, b] = interpolateColor(Math.max(0, Math.min(1, value)));

            // 填充像素
            for (let px = 0; px < stepX && pixelX + px < canvas.width; px++) {
              for (
                let py = 0;
                py < stepY && pixelY + py < canvas.height;
                py++
              ) {
                const idx = ((pixelY + py) * canvas.width + (pixelX + px)) * 4;
                imageData.data[idx] = r;
                imageData.data[idx + 1] = g;
                imageData.data[idx + 2] = b;
                imageData.data[idx + 3] = 255 * opacity;
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
      },
    });

    // 创建图层实例并添加到地图
    const overlay = new canvasOverlay();
    canvasOverlayRef.current = overlay;
    map.addLayer(overlay);

    // 监听地图事件以更新 canvas
    const updateCanvas = () => {
      if (canvasRef.current) {
        const size = map.getSize();
        canvasRef.current.width = size.x;
        canvasRef.current.height = size.y;
        overlay.drawLayer();
      }
    };

    map.on("moveend", updateCanvas);
    map.on("zoomend", updateCanvas);
    map.on("resize", updateCanvas);

    // 初始绘制
    updateCanvas();

    return () => {
      map.off("moveend", updateCanvas);
      map.off("zoomend", updateCanvas);
      map.off("resize", updateCanvas);
      if (canvasOverlayRef.current) {
        map.removeLayer(canvasOverlayRef.current);
      }
    };
  }, [map, scatterData]);

  // 提供一个方法来更新散点数据
  const updateScatterData = (newData: ScatterPoint[]) => {
    setScatterData(newData);
  };

  return null;
};

export default HeatmapLayer;

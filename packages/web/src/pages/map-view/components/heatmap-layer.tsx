import { useContext, useEffect, useRef, useState } from "react";
import L from "leaflet";
import mapContext from "../../../context/MapContext";

// 定义散点数据类型
interface ScatterPoint {
  lat: number;
  lng: number;
  value: number;
}

// 配置常量
const HEATMAP_CONFIG = {
  // 颜色配置
  colors: [
    { value: 0, color: "rgba(0, 0, 255, 0)" }, // 透明蓝色
    { value: 0.25, color: "rgba(0, 255, 255, 0.5)" }, // 青色
    { value: 0.5, color: "rgba(0, 255, 0, 0.5)" }, // 绿色
    { value: 0.75, color: "rgba(255, 255, 0, 0.5)" }, // 黄色
    { value: 1, color: "rgba(255, 0, 0, 0.5)" }, // 红色
  ],
  // IDW 配置
  power: 2, // 距离权重指数
  smoothing: 0.0001, // 平滑因子
  // 渲染配置
  scale: 1, // 缩放因子，值越大计算越快但精度越低
  opacity: 0.8, // 透明度
  // blur: 0.85, // 模糊程度
};

// 生成 mock 散点数据的函数
const generateMockScatterData = (count: number = 30): ScatterPoint[] => {
  const points: ScatterPoint[] = [];
  const mapBounds = {
    minLat: 0,
    maxLat: 64,
    minLng: 0,
    maxLng: 64,
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

// 根据值获取颜色
function getColorForValue(value: number): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const colors = HEATMAP_CONFIG.colors;

  // 找到对应的颜色区间
  let i = 0;
  while (i < colors.length - 1 && colors[i + 1].value <= value) {
    i++;
  }

  if (i === colors.length - 1) {
    return parseColor(colors[i].color);
  }

  // 计算插值
  const start = colors[i];
  const end = colors[i + 1];
  const t = (value - start.value) / (end.value - start.value);

  const startColor = parseColor(start.color);
  const endColor = parseColor(end.color);

  // 线性插值
  return {
    r: Math.round(startColor.r + (endColor.r - startColor.r) * t),
    g: Math.round(startColor.g + (endColor.g - startColor.g) * t),
    b: Math.round(startColor.b + (endColor.b - startColor.b) * t),
    a: Math.round(startColor.a + (endColor.a - startColor.a) * t),
  };
}

// 解析 rgba 颜色字符串
function parseColor(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const match = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/,
  );
  if (!match) throw new Error(`Invalid color format: ${color}`);

  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: Math.round((match[4] ? parseFloat(match[4]) : 1) * 255),
  };
}

const HeatmapLayer = () => {
  const { map } = useContext(mapContext);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasOverlayRef = useRef<L.Layer | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [scatterData, setScatterData] = useState<ScatterPoint[]>([]);

  // 初始化 Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../../utils/interpolation.worker.ts", import.meta.url),
    );
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    // 初始化 mock 数据
    setScatterData(generateMockScatterData(2000));
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
        const ctx = canvas.getContext("2d");
        if (!ctx || !workerRef.current) return;

        // 清除之前的绘制内容
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 准备插值数据
        const points = scatterData.map((point) => ({
          x: point.lng,
          y: point.lat,
          value: point.value,
        }));

        if (points.length < 3) return; // 至少需要3个点才能进行插值

        // 标准化值到 0-1 范围
        const values = points.map((p) => p.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue;

        points.forEach((p) => {
          p.value = range === 0 ? 0.5 : (p.value - minValue) / range;
        });

        // 发送数据到 Worker 进行插值计算
        workerRef.current.postMessage({
          points,
          width: canvas.width,
          height: canvas.height,
          scale: HEATMAP_CONFIG.scale,
          power: HEATMAP_CONFIG.power,
          smoothing: HEATMAP_CONFIG.smoothing,
        });

        // 处理 Worker 返回的结果
        workerRef.current.onmessage = (
          e: MessageEvent<{
            values: Float32Array;
            width: number;
            height: number;
          }>,
        ) => {
          const { values, width, height } = e.data;

          // 创建用于插值后的图像数据
          const imageData = ctx.createImageData(canvas.width, canvas.height);
          const data = imageData.data;

          // 对每个像素进行双线性插值和着色
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              // 计算在缩放网格中的位置
              const gx = (x / canvas.width) * width;
              const gy = (y / canvas.height) * height;

              // 获取周围的网格点
              const x0 = Math.floor(gx);
              const y0 = Math.floor(gy);
              const x1 = Math.min(x0 + 1, width - 1);
              const y1 = Math.min(y0 + 1, height - 1);

              // 计算插值权重
              const wx = gx - x0;
              const wy = gy - y0;

              // 双线性插值
              const value =
                values[y0 * width + x0] * (1 - wx) * (1 - wy) +
                values[y0 * width + x1] * wx * (1 - wy) +
                values[y1 * width + x0] * (1 - wx) * wy +
                values[y1 * width + x1] * wx * wy;

              // 获取颜色
              const color = getColorForValue(value);
              const i = (y * canvas.width + x) * 4;
              data[i] = color.r;
              data[i + 1] = color.g;
              data[i + 2] = color.b;
              data[i + 3] = color.a;
            }
          }

          // 应用模糊效果
          ctx.putImageData(imageData, 0, 0);
          // ctx.filter = `blur(${HEATMAP_CONFIG.blur}px)`;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = "none";

          // 更新或创建图层
          if (canvasOverlayRef.current) {
            map.removeLayer(canvasOverlayRef.current);
          }

          const imageBounds = map.getBounds();
          canvasOverlayRef.current = L.imageOverlay(
            canvas.toDataURL(),
            imageBounds,
            {
              opacity: HEATMAP_CONFIG.opacity,
            },
          ).addTo(map);
        };
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

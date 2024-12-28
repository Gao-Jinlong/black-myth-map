import { IDW } from './idw';

interface InterpolationMessage {
  points: Array<{ x: number; y: number; value: number }>;
  width: number;
  height: number;
  scale: number;
  power?: number;
  smoothing?: number;
}

self.onmessage = (e: MessageEvent<InterpolationMessage>) => {
  const { points, width, height, scale, power = 2, smoothing = 0.0001 } = e.data;
  
  // 使用较低的分辨率进行计算
  const scaledWidth = Math.ceil(width / scale);
  const scaledHeight = Math.ceil(height / scale);
  
  // 使用 IDW 进行插值计算
  const result = IDW.interpolateGrid(
    scaledWidth,
    scaledHeight,
    points,
    power,
    smoothing
  );
  
  self.postMessage({ 
    values: result, 
    width: scaledWidth, 
    height: scaledHeight 
  });
};

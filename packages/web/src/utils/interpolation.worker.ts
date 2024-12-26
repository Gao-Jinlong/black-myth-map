import { Kriging } from './kriging.modern';

interface InterpolationMessage {
  points: Array<{ x: number; y: number; value: number }>;
  width: number;
  height: number;
  scale: number;
  variogram: "gaussian" | "exponential" | "spherical";
  sigma2: number;
  alpha: number;
}

self.onmessage = (e: MessageEvent<InterpolationMessage>) => {
  const { points, width, height, scale, variogram, sigma2, alpha } = e.data;
  
  // 使用较低的分辨率进行计算
  const scaledWidth = Math.ceil(width / scale);
  const scaledHeight = Math.ceil(height / scale);
  
  // 准备训练数据
  const values = points.map(p => p.value);
  const x = points.map(p => p.x);
  const y = points.map(p => p.y);

  // 训练克里金模型
  const model = Kriging.train(values, x, y, variogram, sigma2, alpha);
  
  // 创建结果数组
  const result = new Float32Array(scaledWidth * scaledHeight);
  
  // 计算每个点的插值
  for (let j = 0; j < scaledHeight; j++) {
    for (let i = 0; i < scaledWidth; i++) {
      const lng = i / scaledWidth * 256;
      const lat = j / scaledHeight * 256;
      
      result[j * scaledWidth + i] = Kriging.predict(lng, lat, model);
    }
  }
  
  self.postMessage({ 
    values: result, 
    width: scaledWidth, 
    height: scaledHeight 
  });
};

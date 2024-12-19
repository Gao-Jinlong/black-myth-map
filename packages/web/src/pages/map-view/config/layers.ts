export interface LayerConfig {
  id: string;
  name: string;
  imageUrl: string;
  bounds: [number, number][];
  opacity: number;
}

export const mapLayers: LayerConfig[] = [
  {
    id: "layer1",
    name: "旧观音禅院",
    imageUrl: "assets/black_myth_01_1.jpg",
    bounds: [
      [135, 112],
      [50, 218],
    ],
    opacity: 1,
  },
  // 后续可以轻松添加更多层
];

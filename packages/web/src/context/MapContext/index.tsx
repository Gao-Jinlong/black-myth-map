import L from "leaflet";
import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useState,
} from "react";
import React from "react";

export interface TileConfig {
  url: string;
  name: string;
}

const mapContext = createContext<{
  map: L.Map | null;
  setMap: Dispatch<SetStateAction<L.Map | null>>;
  CRS: L.CRS;
  tile: TileConfig;
  tileList: TileConfig[];
  setTile: Dispatch<SetStateAction<TileConfig>>;
}>({
  map: null,
  setMap: () => {},
  CRS: L.CRS.Simple,
  tile: { url: "", name: "" },
  tileList: [],
  setTile: () => {},
});

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const [map, setMap] = useState<L.Map | null>(null);

  const tileList: TileConfig[] = [
    {
      url: "assets/tile/black_myth_01/{z}/tile_{z}_{y}_{x}.webp",
      name: "黑风山",
    },
    {
      url: "assets/tile/black_myth_02/{z}/tile_{z}_{y}_{x}.webp",
      name: "黄风岭",
    },
  ];

  const [tile, setTile] = useState<TileConfig>(tileList[0]);

  const CRS = L.extend(L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0),
  });

  return (
    <mapContext.Provider value={{ map, setMap, CRS, tile, tileList, setTile }}>
      {children}
    </mapContext.Provider>
  );
};

export default mapContext;

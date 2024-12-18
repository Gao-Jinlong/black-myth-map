import L from "leaflet";
import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useState,
} from "react";
import React from "react";

const mapContext = createContext<{
  map: L.Map | null;
  setMap: Dispatch<SetStateAction<L.Map | null>>;
  CRS: L.CRS;
}>({
  map: null,
  setMap: () => {},
  CRS: L.CRS.Simple,
});

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const [map, setMap] = useState<L.Map | null>(null);

  const CRS = L.extend(L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0),
  });

  return (
    <mapContext.Provider value={{ map, setMap, CRS }}>
      {children}
    </mapContext.Provider>
  );
};

export default mapContext;

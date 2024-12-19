import { useContext } from "react";
import mapContext from "../../../../context/MapContext";

const MapSelect = () => {
  const { tileList, setTile } = useContext(mapContext);

  return (
    <div className="absolute  w-full z-[1000] bg-slate-950 flex  pointer-events-none justify-center">
      {tileList.map((tile) => {
        return (
          <div
            key={tile.name}
            className="flex justify-center pointer-events-auto cursor-pointer"
          >
            <button
              className="bg-amber-800 text-rose-50 p-2 m-2"
              onClick={() => {
                setTile(tile);
              }}
            >
              {tile.name}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default MapSelect;

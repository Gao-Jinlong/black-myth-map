import L from "leaflet";

const debugTile = L.GridLayer.extend({
  createTile: function (coords) {
    // create a <canvas> element for drawing
    var tile = L.DomUtil.create("canvas", "leaflet-tile");

    // setup tile width and height according to the options
    var size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;

    // get a canvas context and draw something on it using coords.x, coords.y and coords.z
    var ctx = tile.getContext("2d");

    // return the tile so it can be rendered on screen
    return tile;
  },
});

export default debugTile;

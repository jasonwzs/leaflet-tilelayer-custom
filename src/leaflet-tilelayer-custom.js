/**
 * A plugin used to implement custom TileLayer.
 * @author Jason Wen (zhenshan.wen@gmail.com)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
L.TileLayer.Custom = L.TileLayer.extend({

	initialize: function (options) {
		L.setOptions(this, options);
		this.options.continuousWorld = true;
		this.impl = options;
	},

	_update: function () {

		if (!this._map) { return; }

		var map = this._map,
			bounds = map.getPixelBounds(),
			zoom = map.getZoom(),
			tileSize = this._getTileSize();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var tileBounds = L.bounds(
				bounds.min.divideBy(tileSize)._floor(),
				bounds.max.divideBy(tileSize)._floor());

		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
	},

	_addTile: function (tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint);

		this._adjustTilePoint(tilePoint);

		var tile = this.impl.getTile(tilePoint, tilePoint.z, this._tileContainer.ownerDocument);
		tile.style.width = tile.style.height = this._getTileSize() + 'px';
		$(tile).addClass('leaflet-tile');

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;

		tile._layer = this;
		tile.onload = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}

		tile.onload();
	}
});

/**
 * Construct a custom TileLayer. 
 * The param options needs carry on an attribute named 'getTile', which is expected to be a function.
 * The getTile function is called whenever the API determines that the map needs to display new tiles for the given viewport. 
 * The getTile method must have the following signature:
 *     getTile(tileCoord:Point,zoom:number,ownerDocument:Document):Node
 * The getTile method should return an HTML element given a passed coordinate, zoom level, and DOM element on which to append the tile image.
 * @param options Information for creating the custom TileLayer.
 * @return {L.TileLayer.Custom}
 */
L.tileLayer.custom = function (options) {
	return new L.TileLayer.Custom(options);
};
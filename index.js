const chunkSize = 16;

class Chunk {
	constructor(parent) {
		this.parent = parent;
		this.tiles = new Uint8Array(chunkSize * chunkSize);
		this.datas = new Uint8Array(chunkSize * chunkSize);
	}
}

class Tilemap {
	static BOUNDARY_SOLID = undefined;
	static BOUNDARY_LOOP = 1;
	static BOUNDARY_NONE = 2;
	static FLUID_NONE = undefined;
	static FLUID_SAND = 1;
	static FLUID_LIQUID = 2;
	constructor(types, boundary, w, h) {
		this.setTypes(types);
		this.setBoundary(bounadry, w, h);
		this.chunks = new Map();
	}
	setTypes(types) {
		this.types = types || [
			{
				name: "air",
			}, {
				name: "sand",
				fluid: Tilemap.FLUID_SAND,
				density: 2,
			}, {
				name: "water",
				fluid: Tilemap.FLUID_LIQUID,
				density: 1,
			}
		];
	}
	setBoundary(bounadry, w, h) {
		boundary ||= Tilemap.BOUNDARY_SOLID;
		if (boundary === Tilemap.BOUNDARY_NONE) {
			delete this.w;
			delete this.h;
			delete this.size;
		} else {
			w ||= 10;
			h ||= 10;
			if (w > Number.MAX_SAFE_INTEGER || h > Number.MAX_SAFE_INTEGER || w * h > Number.MAX_SAFE_INTEGER) {
				console.warn(`Sizes above ${Number.MAX_SAFE_INTEGER} aren't supported`);
				return;
			}
			this.w = w;
			this.h = h;
			this.size = w * h;
			for (const chunk of this.chunks) {
				if (
					chunk[0][0] < 0 || chunk[0][1] < 0 ||
					chunk[0][0] >= w || chunk[0][1] >= h ||
				) this.chunks.delete(chunk[0]);
			}
		}
		this.boundary = boundary;
	}
	print(force) {
		if (!force && (this.chunks.size > 100)) {
			console.warn("This tilemap is massive, pass true to print anyway");
			return;
		}
		console.warn("Not implemented yet");
	}
	fillRandom(ratio, w, h) {
		w = w || this.w || 50;
		h = h || this.h || 50;
		ratio ||= 0.5;
		for (let x = 0; x < w; ++x) {
			for (let y = 0; y < h; ++y) {
				let r = Math.random();
				if (r < ratio)
					this.setTile(x, y, Math.floor(r / ratio * this.types.length));
			}
		}
	}
	setTile(x, y, tile) {
		
	}
}
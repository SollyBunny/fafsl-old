#!/bin/env node

const chunkSize = 16;

class Chunk {
	constructor(x, y, parent) {
		this.parent = parent;
		this.x = x;
		this.y = y;
		this.num = 0;
		this.tiles = new Uint8Array(chunkSize * chunkSize);
		this.datas = new Uint8Array(chunkSize * chunkSize);
	}
	setTile(x, y, tile) {
		const id = y * chunkSize + x;
		if (this.tiles[id] === tile) return;
		this.num += tile === 0 ? -1 : 1;
		this.tiles[id] = tile;
	}
	getTile(x, y) {
		return this.tiles[y * chunkSize + x];
	}
	setData(x, y, tile) {
		this.datas[y * chunkSize + x] = tile;
	}
	getData(x, y) {
		return this.datas[y * chunkSize + x];
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
		this.chunks = new Map();
		this.setTypes(types);
		this.setBoundary(boundary, w, h);
	}
	setTypes(types) {
		this.types = types ?? [
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
	setBoundary(boundary, w, h) {
		boundary ??= Tilemap.BOUNDARY_SOLID;
		if (boundary === Tilemap.BOUNDARY_NONE) {
			delete this.w;
			delete this.h;
			delete this.size;
		} else {
			w ??= 10;
			h ??= 10;
			if (w > Number.MAX_SAFE_INTEGER || h > Number.MAX_SAFE_INTEGER || w * h > Number.MAX_SAFE_INTEGER) {
				console.warn(`Sizes above ${Number.MAX_SAFE_INTEGER} aren't supported`);
				return;
			}
			this.w = w;
			this.h = h;
			this.size = w * h;
			for (const [id, chunk] of this.chunks) {
				if (
					chunk.x < 0 || chunk.y < 0 ||
					(chunk.x + 1) * chunkSize >= w || (chunk.y + 1) * chunkSize >= h
				) this.chunks.delete(id);
			}
		}
		this.boundary = boundary;
	}
	stringify(w, h, force) {
		w = w ?? this.w;
		h = h ?? this.h;
		if (!force && (w > 50 || h > 50)) {
			console.warn("This tilemap is massive, pass true to print anyway");
			return;
		}
		let out = "";
		for (let y = 0; y < h; ++y) {
			for (let x = 0; x < w; ++x) {
				const tile = this.getTile(x, y);
				if (tile === 0) out += "__";
				else out += `_${tile}`;
			}
			out += "\n";
		}
		return out;
	}
	print(w, h, force) {
		w = w ?? this.w;
		h = h ?? this.h;
		if (!force && (w > 50 || h > 50)) {
			console.warn("This tilemap is massive, pass true to print anyway");
			return;
		}
		console.log(this.stringify(w, h, true));
	}
	fillRandom(w, h, ratio) {
		ratio ??= 0.5;
		w = w ?? this.w ?? 50;
		h = h ?? this.h ?? 50;
		for (let x = 0; x < w; ++x) {
			for (let y = 0; y < h; ++y) {
				let r = Math.random();
				this.setTile(x, y, r > ratio ? 0 : 1 + Math.floor(r / ratio * (this.types.length - 1)));
			}
		}
	}
	fillTiles(w, h, tile, data) {
		for (let x = 0; x < w; ++x) {
			for (let y = 0; y < h; ++y) {
				if (tile !== undefined)
					this.setTile(x, y, tile);
				if (data !== undefined)
					this.setData(x, y, data);
			}
		}
	}
	gc() {
		for (const [id, chunk] of this.chunks) {
			if (chunk.num <= 0)
				this.chunks.delete(id);
		}
	}
	normX(x) {
		switch (this.boundary) {
			case Tilemap.BOUNDARY_NONE: return x;
			case Tilemap.BOUNDARY_LOOP: return (x % this.w + this.w) % this.w;
			case Tilemap.BOUNDARY_SOLID: return Math.max(0, Math.min(this.w - 1, x));
		}
	}
	normY(y) {
		switch (this.boundary) {
			case Tilemap.BOUNDARY_NONE: return y;
			case Tilemap.BOUNDARY_LOOP: return (y % this.h + this.h) % this.h;
			case Tilemap.BOUNDARY_SOLID: return Math.max(0, Math.min(this.h - 1, y));
		}
	}
	getChunk(x, y) {
		const id = y * (1 << 13) + x; // NOTE: this enforces a max chunk size of 8192
		if (this.chunks.has(id)) return this.chunks.get(id);
		const chunk = new Chunk(x, y, this);
		this.chunks.set(id, chunk);
		return chunk;
	}
	setTile(x, y, tile) {
		x = this.normX(x);
		y = this.normY(y);
		const chunk = this.getChunk(Math.floor(x / chunkSize), Math.floor(y / chunkSize));
		chunk.setTile(x % chunkSize, y % chunkSize, tile);
	}
	getTile(x, y) {
		x = this.normX(x);
		y = this.normY(y);
		const chunk = this.getChunk(Math.floor(x / chunkSize), Math.floor(y / chunkSize));
		return chunk.getTile(x % chunkSize, y % chunkSize);
	}
	setData(x, y, data) {
		x = this.normX(x);
		y = this.normY(y);
		const chunk = this.getChunk(Math.floor(x / chunkSize), Math.floor(y / chunkSize));
		chunk.setData(x % chunkSize, y % chunkSize, data);
	}
	getData(x, y) {
		x = this.normX(x);
		y = this.normY(y);
		const chunk = this.getChunk(Math.floor(x / chunkSize), Math.floor(y / chunkSize));
		return chunk.getData(x % chunkSize, y % chunkSize);
	}
}

export { Tilemap, chunkSize };
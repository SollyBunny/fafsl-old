import { Tilemap, chunkSize } from "./fafsl.js"

let tm = new Tilemap(undefined, Tilemap.BOUNDARY_LOOP, 30, 30);
tm.fillRandom(tm.w, tm.h, 0.1);
function isInCircle(x, y, w, h) {
    const dx = x - w / 2;
    const dy = y - h / 2;
    return dx * dx + dy * dy <= (w / 2) * (h / 2);
}
for (let x = tm.w * 0.4; x <= tm.w * 0.4 + Math.ceil(tm.w * 0.2); ++x) {
    for (let y = tm.w * 0.1; y <= tm.w * 0.1 + Math.ceil(tm.w * 0.2); ++y) {
        if (isInCircle(x - tm.w * 0.4, y - tm.w * 0.1, tm.w * 0.2 + 1, tm.w * 0.2 + 1)) {
            
            tm.setTile(Math.round(x), Math.round(y), 2);
        }
    }
}

function tickTileEmpty(to, tn, x, y) {
    const t = to.getTile(x, y);
    if (t !== 255) tickTile(to, tn, t, x, y);
    return tn.getTile(x, y) === 0;
}
function tickTile(to, tn, t, x, y) {
    const types = to.types;
    const d = to.getData(x, y);
    if (types[t].fluid !== undefined && tickTileEmpty(to, tn, x, y + 1)) {
        tn.setTile(x, y + 1, t); tn.setData(x, y + 1, d);
    } else {
        tn.setTile(x, y, t); tn.setData(x, y, d);
    }
}
function tick(to) {
    const tn = new Tilemap(to.types, to.boundary, to.w, to.h);
    const types = to.types;
    for (const [id, chunk] of to.chunks) {
        for (let cy = 0; cy < chunkSize; ++cy) {
            for (let cx = 0; cx < chunkSize; ++cx) {
                const x = tn.normX(chunk.x * chunkSize + cx);
                const y = tn.normY(chunk.y * chunkSize + cy);
                const t = chunk.getTile(cx, cy);
                tickTile(to, tn, t, x, y);
            }
        }
    }
    return tn;
}

tm.print(tm.w, tm.h, true);
tm = tick(tm);
console.log("tick")
tm.print(tm.w, tm.h, true);


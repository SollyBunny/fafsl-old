import { Tilemap, chunkSize } from "./fafsl.js"

let tm = new Tilemap(undefined, Tilemap.BOUNDARY_LOOP, process.stdout.columns / 2, process.stdout.rows);
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
for (let x = tm.w * 0.3; x < tm.w * 0.7; ++x) {
    tm.setTile(Math.round(x), Math.round(tm.h * 0.9), 1);
}

function tick(to) {
    const tn = new Tilemap(to.types, to.boundary, to.w, to.h);
    const types = to.types;
    const stack = [];
    for (const [id, chunk] of to.chunks) {
        for (let cy = 0; cy < chunkSize; ++cy) {
            for (let cx = 0; cx < chunkSize; ++cx) {
                const x = chunk.x * chunkSize + cx;
                const y = chunk.y * chunkSize + cy;
                if (x !== tn.normX(x) || y !== tn.normY(y)) continue;
                const t = chunk.getTile(cx, cy);
                stack.push([t, x, y]);
            }
        }
    }
    let element;
    function tickTileEmpty(x, y) {
        const t = to.getTile(x, y);
        if (t === 255)
            return tn.getTile(x, y) === 0;
        for (let i = 0; i < stack.length; ++i) {
            if (stack[i][1] === x && stack[i][2] === y) {
                stack.splice(i, 1);
                stack.push([t, x, y]);
                // stack.push(element);
                return false;
            }
        }
        stack.push([t, x, y]);
        stack.push(element)
        return undefined;
    }
    let empty;
    let i = 0;
    while (stack.length > 0) {
        element = stack.pop();
        i += 1;
        if (i > 5000) console.log(stack.length, ...element, i);
        const t = element[0];
        if (t === 255) return; // Already processed
        const x = element[1];
        const y = element[2];
        let d = to.getData(x, y);
        if (types[t].fluid !== undefined) {
            empty = tickTileEmpty(x, y + 1)
            if (empty === undefined) continue;
            if (empty) {
                tn.setTile(x, y + 1, t); tn.setData(x, y + 1, d);
            } else {
                if (d === 0) {
                    d = (x + y) % 2 + 1;
                }
                const offset = d === 1 ? -1 : 1;
                if (types[t].fluid === Tilemap.FLUID_LIQUID) {
                    empty = tickTileEmpty(x + offset, y)
                    if (empty === undefined) continue;
                    if (empty) {
                        tn.setTile(x + offset, y, t); tn.setData(x + offset, y, d);
                    } else {
                        empty = tickTileEmpty(x - offset, y)
                        if (empty === undefined) continue;
                        if (empty) {
                            d = 2 - d;
                            tn.setTile(x - offset, y, t); tn.setData(x - offset, y, d);
                        } else {
                            tn.setTile(x, y, t); tn.setData(x, y, d);    
                        }    
                    }
                    
                } else if (types[t].fluid === Tilemap.FLUID_SAND) {
                    // TODO
                    tn.setTile(x, y, t); tn.setData(x, y, d);
                } else {
                    tn.setTile(x, y, t); tn.setData(x, y, d);
                }
            }
        } else {
            tn.setTile(x, y, t); tn.setData(x, y, d);
        }
        to.setTile(x, y, 255);
    }
    return tn;
}

function sleep(t) { return new Promise(resolve => setTimeout(resolve, t)); }
async function main() {
    while (1) {
        // Tick
        const old = performance.now();
        tm = tick(tm);
        const now = performance.now();
        // Print
        console.log("\x1b[2J\x1b[0H");
        tm.print(tm.w, tm.h, true);
        console.log("Now:", now, "Delta:", now - old);
        // Wait
        await sleep(250);
    }
}

main();


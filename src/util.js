import { parsePalette } from 'cpt2js';


export async function createCMAP(folder, cptName, dataMin, dataMax) {
    const { default: thermalCPT } = await import(`./assets/cmaps/cpt-city/${folder}/${cptName}.cpt?raw`);
    const thermal = parsePalette(thermalCPT);
    const n = 256;
    const cptMin = 1;
    const cptMax = 256;
    const palette = Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const value = dataMin + t * (dataMax - dataMin);
        const mapped = cptMin + ((value - dataMin) / (dataMax - dataMin)) * (cptMax - cptMin);
        const color = thermal(mapped).toString();
        return [value, color];
    });
    return palette;
}

export function createVectorWindImage(uwind, vwind) {
    const width = uwind.width;
    const height = uwind.height;

    const u = uwind.data;
    const v = vwind.data;
    const expected = width * height;

    const out = new Uint8Array(expected * 4);

    // Map physical range [-30, 30] m/s to byte range [0, 255]
    const minVal = -30;
    const maxVal = 30;
    const range = maxVal - minVal;
    const scale = 255 / range;

    let j = 0;
    for (let i = 0; i < expected; i++, j += 4) {
        const ui = u[i];
        const vi = v[i];

        const ru = Math.round((Math.min(Math.max(ui, minVal), maxVal) - minVal) * scale);
        const gv = Math.round((Math.min(Math.max(vi, minVal), maxVal) - minVal) * scale);

        // Interleaved encoding: R = scaled u, G = scaled v, B = 0, A = 255
        out[j]     = ru;
        out[j + 1] = gv;
        out[j + 2] = 0;
        out[j + 3] = 255;
    }

    return { data: out, width, height };
}

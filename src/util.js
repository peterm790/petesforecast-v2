import { parsePalette } from 'cpt2js';

// Preload all CPT files so nested subfolders can be resolved at runtime
const CPT_RAW = import.meta.glob('./assets/cmaps/cpt-city/**/*.cpt', { as: 'raw' });

function extractCptDomain(cptText) {
    const lines = cptText.split(/\r?\n/);
    const values = [];
    const numberRegex = /[-+]?(?:\d+\.\d+|\d+|\.\d+)(?:[eE][-+]?\d+)?/g;
    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('#')) continue;
        const firstChar = line[0];
        if (firstChar === 'B' || firstChar === 'F' || firstChar === 'N') continue;
        const nums = line.match(numberRegex);
        if (!nums) continue;
        if (nums.length >= 8) {
            values.push(parseFloat(nums[0]));
            values.push(parseFloat(nums[4]));
        } else if (nums.length >= 2) {
            values.push(parseFloat(nums[0]));
            values.push(parseFloat(nums[1]));
        }
    }
    if (values.length === 0) {
        return { cptMin: 1, cptMax: 256 };
    }
    let min = values[0];
    let max = values[0];
    for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
    }
    return { cptMin: min, cptMax: max };
}


export async function createCMAP(folder, cptName, dataMin, dataMax) {
    const key = `./assets/cmaps/cpt-city/${folder}/${cptName}.cpt`;
    const loader = CPT_RAW[key];
    if (!loader) {
        throw new Error(`Colormap not found: ${key}`);
    }
    const thermalCPT = await loader();
    const { cptMin, cptMax } = extractCptDomain(thermalCPT);
    const thermal = parsePalette(thermalCPT);
    const n = 256;
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

export async function fetchInitTimeRange() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const url = 'https://iyb260zpcg.execute-api.us-west-2.amazonaws.com/dataset/?url=https%3A%2F%2Fdata.dynamical.org%2Fnoaa%2Fgfs%2Fforecast%2Flatest.zarr&decode_times=true';

    let response;
    try {
        response = await fetch(url, { method: 'GET', headers: { Accept: 'text/html' }, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response || !response.ok) {
        throw new Error(`Failed to fetch dataset HTML: ${response ? response.status + ' ' + response.statusText : 'no response'}`);
    }

    const html = await response.text();

    const initIdx = html.indexOf('* init_time');
    if (initIdx === -1) {
        throw new Error('init_time section not found');
    }
    const afterInit = html.slice(initIdx);

    const arrStart = afterInit.indexOf('array([');
    if (arrStart === -1) {
        throw new Error('init_time array not found');
    }
    const arraySection = afterInit.slice(arrStart);
    const match = arraySection.match(/array\(\[([\s\S]*?)\]\s*,\s*(?:shape|dtype)=/);
    if (!match) {
        throw new Error('init_time array terminator not found');
    }
    const arrayContent = match[1];

    const timestamps = [...arrayContent.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}/g)].map(m => m[0]);
    if (timestamps.length === 0) {
        throw new Error('No init_time timestamps parsed');
    }

    timestamps.sort();
    return [timestamps[0], timestamps[timestamps.length - 1]];
}

export function parseInitTimeToDate(initTime) {
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.[0-9]+)?$/.exec(initTime);
    if (!m) {
        throw new Error(`Invalid init time format: ${initTime}`);
    }
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1; // 0-based
    const day = parseInt(m[3], 10);
    const hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    const second = parseInt(m[6], 10);
    const utcMs = Date.UTC(year, month, day, hour, minute, second, 0);
    return new Date(utcMs);
}

export function generateInitTimes6h(firstInitTime, lastInitTime) {
    const first = parseInitTimeToDate(firstInitTime);
    const last = parseInitTimeToDate(lastInitTime);

    if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
        throw new Error('Invalid date parsed from init time');
    }
    if (first.getTime() > last.getTime()) {
        throw new Error('First init time is after last init time');
    }

    const stepMs = 6 * 60 * 60 * 1000;
    const out = [];
    for (let t = first.getTime(); t <= last.getTime(); t += stepMs) {
        out.push(new Date(t));
    }
    return out;
}

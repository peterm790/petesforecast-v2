import { parsePalette } from 'cpt2js';

// Preload all CPT files so nested subfolders can be resolved at runtime
const CPT_RAW = import.meta.glob('./assets/cmaps/cpt-city/**/*.cpt', { query: '?raw', import: 'default' });

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

export function combineWindBytesToImage(uwind, vwind) {
    const width = uwind.width;
    const height = uwind.height;
    if (!(uwind.data instanceof Uint8Array) || !(vwind.data instanceof Uint8Array)) {
        throw new Error('Expected uint8 wind inputs');
    }
    const u = uwind.data;
    const v = vwind.data;
    const expected = width * height;
    const out = new Uint8Array(expected * 4);
    for (let i = 0, j = 0; i < expected; i++, j += 4) {
        out[j] = u[i];
        out[j + 1] = v[i];
        out[j + 2] = 0;
        out[j + 3] = 255;
    }
    return { data: out, width, height };
}

export function computeWindSpeedFromUVBytes(uwind, vwind, uMin, uMax, vMin, vMax) {
    const width = uwind.width;
    const height = uwind.height;
    if (!uwind || !vwind || width !== vwind.width || height !== vwind.height) {
        throw new Error('U/V wind tiles must be defined and have matching dimensions');
    }
    if (!(uwind.data instanceof Uint8Array) || !(vwind.data instanceof Uint8Array)) {
        throw new Error('Expected uint8 wind inputs');
    }

    const uBytes = uwind.data;
    const vBytes = vwind.data;
    const expected = width * height;
    const out = new Float32Array(expected);

    const uSpan = uMax - uMin;
    const vSpan = vMax - vMin;

    for (let i = 0; i < expected; i++) {
        const u = uMin + (uBytes[i] / 255) * uSpan;
        const v = vMin + (vBytes[i] / 255) * vSpan;
        out[i] = Math.hypot(u, v);
    }

    return { data: out, width, height };
}

export function createCategoricalPalette(absenceColor, presenceColor) {
    // Returns [[value, color], ...] pairs compatible with RasterLayer palette API
    return [
        [0, absenceColor],
        [1, presenceColor]
    ];
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

export function formatUTC(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getUTCDay()];
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mi = String(date.getUTCMinutes()).padStart(2, '0');
    return `${dayName} (${dd}/${mm}/${yyyy}) ${hh}:${mi} UTC`;
}

export function formatLocal(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const offsetMin = -date.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const offH = Math.floor(abs / 60);
    const offM = abs % 60;
    const tz = offM ? `GMT${sign}${offH}:${String(offM).padStart(2, '0')}` : `GMT${sign}${offH}`;
    return `${dayName} (${dd}/${mm}/${yyyy}) ${hh}:${mi} ${tz}`;
}

// Get rough location from IP geolocation (country/continent level)
// Returns { longitude, latitude } or null on failure
export async function getLocationFromIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP geolocation failed');
        
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
            const lat = parseFloat(data.latitude);
            const lon = parseFloat(data.longitude);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                return { longitude: lon, latitude: lat };
            }
        }
    } catch (error) {
        console.log('IP geolocation fallback failed:', error);
    }
    return null;
}

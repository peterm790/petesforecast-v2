import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.resolve(__dirname, '../../wind_cache_state.json');
const VARIABLES_FILE = path.resolve(__dirname, '../../src/assets/weather_variables.json');
const API_BASE = 'https://api.onlineweatherrouting.com';
const BOUNDS = [-180.125, -72.125, 179.875, 72.125]; // minLon, minLat, maxLon, maxLat

// --- Helpers from src/util.js ---

function parseInitTimeToDate(initTime) {
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

function generateInitTimes6h(firstInitTime, lastInitTime) {
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

async function fetchInitTimeRange() {
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

// --- Helpers from src/index.js ---

function hourToTimestepIndex(hour) {
    if (!Number.isInteger(hour) || hour < 0) {
        throw new Error(`Invalid lead hour: ${hour}`);
    }
    if (hour > 381) {
        throw new Error(`Lead hour ${hour} exceeds dataset range (max 381h)`);
    }
    if (hour <= 120) return hour;
    if (hour < 123) {
        throw new Error(`Lead hour ${hour} not available; expected 0-120 hourly or >=123 in 3-hour steps`);
    }
    if (hour % 3 !== 0) {
        throw new Error(`Lead hour ${hour} not a 3-hour multiple in extended range`);
    }
    return 121 + Math.floor((hour - 120) / 3);
}

function buildMultiUrl(weatherVariables, variableKey, leads, initIndex) {
    const def = weatherVariables[variableKey];
    if (!def) throw new Error(`Unknown weather variable: ${variableKey}`);
    const physMin = typeof def.physMin === 'number' ? def.physMin : def.min;
    const physMax = typeof def.physMax === 'number' ? def.physMax : def.max;
    const [minLon, minLat, maxLon, maxLat] = BOUNDS;
    
    let url = `${API_BASE}/bbox/${minLon},${minLat},${maxLon},${maxLat}.npy?url=https%3A%2F%2Fdata.dynamical.org%2Fnoaa%2Fgfs%2Fforecast%2Flatest.zarr&variable=${encodeURIComponent(variableKey)}&isel=init_time%3D${encodeURIComponent(initIndex)}&decode_times=true&npy_uint8=true&rescale=${encodeURIComponent(physMin)},${encodeURIComponent(physMax)}&return_mask=false`;
    
    for (const leadHour of leads) {
        const tIndex = hourToTimestepIndex(leadHour);
        url += `&isel=lead_time%3D${encodeURIComponent(tIndex)}`;
    }
    return url;
}

function toIsoZ(d) { return d.toISOString().replace('.000Z', 'Z'); }

// --- Main Logic ---

async function main() {
    console.log('Starting wind cache update...');

    // 1. Load weather variables
    let weatherVariables;
    try {
        const rawVars = await fs.readFile(VARIABLES_FILE, 'utf-8');
        weatherVariables = JSON.parse(rawVars);
    } catch (err) {
        console.error('Failed to load weather_variables.json:', err);
        process.exit(1);
    }

    // 2. Load previous state
    let lastCachedInit = null;
    try {
        const rawState = await fs.readFile(STATE_FILE, 'utf-8');
        const state = JSON.parse(rawState);
        lastCachedInit = state.lastInit;
        console.log(`Found previous state: lastInit=${lastCachedInit}, updated=${state.updatedAt}`);
    } catch (err) {
        console.log('No valid previous state found. Will run fresh.');
    }

    // 3. Fetch current init range from source
    let firstStr, latestStr, initIsosAsc, latestISO, latestIndex;
    try {
        [firstStr, latestStr] = await fetchInitTimeRange();
        const sixHourlyDates = generateInitTimes6h(firstStr, latestStr);
        initIsosAsc = sixHourlyDates.map(toIsoZ);
        latestISO = parseInitTimeToDate(latestStr).toISOString().replace('.000Z', 'Z');
        latestIndex = initIsosAsc.indexOf(latestISO);
        
        if (latestIndex === -1) {
            throw new Error(`Latest ISO ${latestISO} not found in generated range.`);
        }
        console.log(`Latest available init: ${latestISO} (index ${latestIndex})`);
    } catch (err) {
        console.error('Failed to fetch init time range:', err);
        process.exit(1);
    }

    // 4. Check if we need to update
    if (lastCachedInit === latestISO) {
        console.log('Latest init matches cached init. No update needed.');
        process.exit(0);
    }

    console.log(`New init detected (cached: ${lastCachedInit}, new: ${latestISO}). Starting cache warming...`);

    // 5. Cache loop
    // Fetch 5 days of data (0-120 hours) for wind_u_10m and wind_v_10m
    const leads = Array.from({ length: 121 }, (_, i) => i); // 0 to 120 inclusive
    const variables = ['wind_u_10m', 'wind_v_10m'];
    const CHUNK_SIZE = 12;
    const requests = [];

    console.log(`Starting parallel cache warming for ${variables.length * Math.ceil(leads.length / CHUNK_SIZE)} chunks...`);

    for (const variable of variables) {
        for (let i = 0; i < leads.length; i += CHUNK_SIZE) {
            const chunk = leads.slice(i, i + CHUNK_SIZE);
            const url = buildMultiUrl(weatherVariables, variable, chunk, latestIndex);
            
            requests.push(
                fetch(url).then(async (res) => {
                    if (!res.ok) {
                        throw new Error(`Failed to fetch ${variable} leads ${chunk[0]}-${chunk[chunk.length-1]}: ${res.status}`);
                    }
                    // Consume body to ensure caching completes, but ignore data
                    await res.arrayBuffer(); 
                    console.log(`  -> Cached ${variable} [${chunk[0]}-${chunk[chunk.length-1]}]`);
                })
            );
        }
    }

    try {
        // Run all requests in parallel
        await Promise.all(requests);
    } catch (err) {
        console.error('Error during cache warming:', err);
        process.exit(1);
    }

    // 6. Update state
    const newState = {
        lastInit: latestISO,
        updatedAt: new Date().toISOString()
    };

    try {
        await fs.writeFile(STATE_FILE, JSON.stringify(newState, null, 2));
        console.log('State updated successfully.');
    } catch (err) {
        console.error('Failed to write state file:', err);
        process.exit(1);
    }
    
    console.log('Wind cache update complete.');
}

main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});


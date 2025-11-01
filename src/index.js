// only JS code here...
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import basemapStyle from './assets/basemapstyle.json';
import { combineWindBytesToImage, computeWindSpeedFromUVBytes, createCMAP, createCategoricalPalette, fetchInitTimeRange, parseInitTimeToDate, generateInitTimes6h } from './util.js';
import { MenuBar } from '@menu_bar/menubar.js';
import '@menu_bar/menubar.css';
import { TimeSlider } from '@time_slider/timeslider.js';
import '@time_slider/timeslider.css';
import { LoadingOverlay } from './loading_overlay/loading.js';
import './loading_overlay/loading.css';
import { DataCache } from './data/cache.js';
import weatherVariables from './assets/weather_variables.json';
import { createLegendManager } from './controls/legend.js';
import { createTooltipManager } from './controls/tooltip.js';

function toIsoZ(d) { return d.toISOString().replace('.000Z', 'Z'); }
let INIT_ISOS_ASC = null;
let latestISO = null;
async function loadInitRange() {
    const [firstStr, latestStr] = await fetchInitTimeRange();
    const sixHourlyDates = generateInitTimes6h(firstStr, latestStr);
    INIT_ISOS_ASC = sixHourlyDates.map(toIsoZ);
    latestISO = parseInitTimeToDate(latestStr).toISOString().replace('.000Z', 'Z');
}
function getInitIndexFromState(state) {
    if (!INIT_ISOS_ASC) throw new Error('Init times not loaded');
    const iso = state.initData;
    const idx = INIT_ISOS_ASC.indexOf(iso);
    if (idx === -1) throw new Error(`Unknown init: ${iso}`);
    return idx; // earliest=0 ... latest=max
}

const bounds = [-180.125, -72.125, 179.875, 72.125];

const map = new maplibregl.Map({
    container: 'map', // container id
    style: basemapStyle, // local style
    center: [12, -10], // starting position [lng, lat]
    zoom: 2.5, // starting zoom
    minZoom: 2,
    maxZoom: 15
});

// deck.gl overlay (lazy); created on first render
let deckOverlay = null;
async function ensureDeckOverlay() {
    if (deckOverlay) return deckOverlay;
    const mod = await import('@deck.gl/mapbox');
    const MapboxOverlay = mod.MapboxOverlay;
    deckOverlay = new MapboxOverlay({ interleaved: true, layers: [] });
    map.addControl(deckOverlay);
    return deckOverlay;
}

let deckLayerMods = null;
async function ensureLayerModules() {
    if (deckLayerMods) return deckLayerMods;
    const [wl, ext] = await Promise.all([
        import('weatherlayers-gl'),
        import('@deck.gl/extensions')
    ]);
    deckLayerMods = {
        RasterLayer: wl.RasterLayer,
        ParticleLayer: wl.ParticleLayer,
        ClipExtension: ext.ClipExtension
    };
    return deckLayerMods;
}

// Tooltip state (click-to-pin)
let tooltipPinned = false;
let lastPickedLngLat = null; // [lng, lat]
let currentLegendHost = null; // kept for compatibility with selected line ref
// Sampling state (declare early to avoid TDZ when used inside renderFromCache)
let lastRasterImage = null; // { data: Float32Array, width, height }
let lastUWind = null; // { data: Uint8Array, width, height }
let lastVWind = null; // { data: Uint8Array, width, height }
let lastUMin = 0, lastUMax = 0, lastVMin = 0, lastVMax = 0;

function isMenuOpen() {
    const wrap = document.querySelector('.pf-menubar-wrap');
    // open when wrap not hidden
    return !!(wrap && !wrap.classList.contains('hidden'));
}

const legendManager = createLegendManager({ isMenuOpen });
const tooltipManager = createTooltipManager({ getDeckOverlay: () => deckOverlay });

function updateTooltipUnitFormat(variableKey) {
    const def = weatherVariables[variableKey] || {};
    const unit = typeof def.unit === 'string' ? def.unit : '';
    try { tooltipManager.updateUnit(unit); } catch {}
}

async function fetchFrames(url, signal) {
    const response = await fetch(url, { method: 'GET', signal });
    if (!response.ok) {
        throw new Error(`Request failed with ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const { default: NPY } = await import('npyjs');
    const npy = new NPY();
    const { data: flat, shape } = await npy.load(arrayBuffer);

    if (!Array.isArray(shape)) {
        throw new Error(`Invalid shape from API: ${JSON.stringify(shape)}`);
    }
    if (shape.length === 2) {
        const height = shape[0];
        const width = shape[1];
        const planeSize = width * height;
        const frames = [ { data: flat.subarray(0, planeSize), width, height } ];
        if (DEBUG_ORDER) console.log('[ORDER][RESP]', { shape, frames: frames.length, width, height });
        return frames;
    }
    if (shape.length === 3) {
        const t = shape[0];
        const height = shape[1];
        const width = shape[2];
        const planeSize = width * height;
        const frames = [];
        for (let i = 0; i < t; i++) {
            const start = i * planeSize;
            const end = start + planeSize;
            frames.push({ data: flat.subarray(start, end), width, height });
        }
        if (DEBUG_ORDER) console.log('[ORDER][RESP]', { shape, frames: frames.length, width, height });
        return frames;
    }
    throw new Error(`Unexpected array shape from API: ${JSON.stringify(shape)}`);
}

const API_BASE = 'https://api.onlineweatherrouting.com';
// Tunable: number of lead_time slices per request
const LEAD_CHUNK_SIZE = 12;
// Debug switch for tracing lead/frame ordering
const DEBUG_ORDER = true;
if (typeof window !== 'undefined') {
    try { window.DEBUG_ORDER = DEBUG_ORDER; } catch {}
}
//const API_BASE_ORIGINAL = 'https://iyb260zpcg.execute-api.us-west-2.amazonaws.com';

// Convert a forecast lead hour to the dataset's timestep index.
// Rules: 0-120h are hourly mapped 1:1; >=123h are 3-hourly starting from index 122 → 123h.
// Derived piecewise mapping:
//  - hour ≤ 120 → index = hour
//  - hour ≥ 123 and hour % 3 === 0 → index = 121 + (hour - 120) / 3
// Hour 121/122 are not valid (no data); we raise errors to avoid silent fallbacks.
function hourToTimestepIndex(hour) {
    if (!Number.isInteger(hour) || hour < 0) {
        throw new Error(`Invalid lead hour: ${hour}`);
    }
    // Max supported hour is 381 (index 208); 384 would imply index 209 which does not exist
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

function buildMultiUrl(variableKey, leads, initIndex) {
    const def = weatherVariables[variableKey];
    if (!def) throw new Error(`Unknown weather variable: ${variableKey}`);
    const physMin = typeof def.physMin === 'number' ? def.physMin : def.min;
    const physMax = typeof def.physMax === 'number' ? def.physMax : def.max;
    const [minLon, minLat, maxLon, maxLat] = bounds;
    let url = `${API_BASE}/bbox/${minLon},${minLat},${maxLon},${maxLat}.npy?url=https%3A%2F%2Fdata.dynamical.org%2Fnoaa%2Fgfs%2Fforecast%2Flatest.zarr&variable=${encodeURIComponent(variableKey)}&isel=init_time%3D${encodeURIComponent(initIndex)}&decode_times=true&npy_uint8=true&rescale=${encodeURIComponent(physMin)},${encodeURIComponent(physMax)}&return_mask=false`;
    for (const leadHour of leads) {
        const tIndex = hourToTimestepIndex(leadHour);
        url += `&isel=lead_time%3D${encodeURIComponent(tIndex)}`; // '%3D' is '='
    }
    if (DEBUG_ORDER) console.log('[ORDER][REQ]', { variableKey, initIndex, leadHours: leads.slice() });
    return url;
}

function leadsForFrequency(freq) {
    if (freq === '24h') return Array.from({ length: 24 }, (_, i) => i + 1);
    if (freq === '3d') return Array.from({ length: 72 }, (_, i) => i + 1);
    if (freq === '5d') return Array.from({ length: 120 }, (_, i) => i + 1);
    if (freq === '16d-3h') return Array.from({ length: 127 }, (_, i) => (i + 1) * 3); // 3..381
    throw new Error(`Unknown frequency: ${freq}`);
}

async function renderFromCache(state, leadHours) {
    const def = weatherVariables[state.variable];
    if (!def) throw new Error(`Unknown weather variable: ${state.variable}`);
    const dataMin = typeof state.dataMin === 'number' ? state.dataMin : def.min;
    const dataMax = typeof state.dataMax === 'number' ? state.dataMax : def.max;
    const initKey = getInitIndexFromState(state);
    let rasterData = dataCache.get(state.variable, leadHours, initKey);
    const uwind = dataCache.get('wind_u_10m', leadHours, initKey);
    const vwind = dataCache.get('wind_v_10m', leadHours, initKey);
    if (DEBUG_ORDER) console.log('[ORDER][READ]', { initKey, variable: state.variable, leadHours, hasRaster: !!rasterData, hasU: !!uwind, hasV: !!vwind });
    // If wind speed is requested, compute from U and V instead of fetching from server
    if (state.variable === 'wind_speed_10m' && uwind && vwind) {
        const uDef = weatherVariables['wind_u_10m'];
        const vDef = weatherVariables['wind_v_10m'];
        const uPhysMin = typeof uDef.physMin === 'number' ? uDef.physMin : uDef.min;
        const uPhysMax = typeof uDef.physMax === 'number' ? uDef.physMax : uDef.max;
        const vPhysMin = typeof vDef.physMin === 'number' ? vDef.physMin : vDef.min;
        const vPhysMax = typeof vDef.physMax === 'number' ? vDef.physMax : vDef.max;
        rasterData = computeWindSpeedFromUVBytes(uwind, vwind, uPhysMin, uPhysMax, vPhysMin, vPhysMax);
    }
    if (!rasterData) {
        console.warn('Cache not ready for lead', leadHours, { hasVar: !!rasterData, hasU: !!uwind, hasV: !!vwind });
        return; // wait until variable is cached
    }
    const palette = def.categorical
        ? createCategoricalPalette(def.absence_colour || '#000000', def.presence_colour || '#ffffff')
        : await createCMAP(state.colormapGenre, state.colormap, dataMin, dataMax);
    let vectorWind = null;
    if (uwind && vwind) {
        vectorWind = combineWindBytesToImage(uwind, vwind);
    }

    // Convert Uint8 raster to Float32 physical values before passing to the layer
    let rasterImage = rasterData;
    if (rasterData && rasterData.data instanceof Uint8Array && rasterData.data.length === rasterData.width * rasterData.height) {
        const src = rasterData.data;
        const expected = rasterData.width * rasterData.height;
        const out = new Float32Array(expected);
        const minV = typeof def.physMin === 'number' ? def.physMin : def.min;
        const maxV = typeof def.physMax === 'number' ? def.physMax : def.max;
        const span = maxV - minV;
        for (let i = 0; i < expected; i++) {
            out[i] = minV + (src[i] / 255) * span;
        }
        rasterImage = { data: out, width: rasterData.width, height: rasterData.height };
    }

    await ensureDeckOverlay();
    const { RasterLayer, ParticleLayer, ClipExtension } = await ensureLayerModules();

    const raster = new RasterLayer({
        id: 'raster',
        image: rasterImage,
        imageMinValue: (typeof def.physMin === 'number' ? def.physMin : def.min),
        imageMaxValue: (typeof def.physMax === 'number' ? def.physMax : def.max),
        bounds: bounds,
        palette: palette,
        extensions: [new ClipExtension()],
        clipBounds: bounds,
        opacity: 0.6,
        pickable: true,
        beforeId: 'physical_line_stream'
    });

    const layers = [raster];
    if (uwind && vwind && vectorWind) {
        const windDef = weatherVariables['wind_u_10m'];
        const windMin = typeof windDef.physMin === 'number' ? windDef.physMin : windDef.min;
        const windMax = typeof windDef.physMax === 'number' ? windDef.physMax : windDef.max;
        const particle = new ParticleLayer({
            id: 'particle',
            image: vectorWind,
            bounds: bounds,
            imageUnscale: [windMin, windMax],
            extensions: [new ClipExtension()],
            clipBounds: bounds,
            numParticles: 5500,
            maxAge: 17,
            speedFactor: 8,
            width: 0.6,
            color: [60, 70, 85],
            opacity: 0.6,
            animate: true
        });
        layers.push(particle);
    }

    deckOverlay.setProps({ layers });
    if (DEBUG_ORDER) console.log('[ORDER][RENDERED]', { renderedLead: leadHours, variable: state.variable });

    // Keep last-rendered data for value picking
    lastRasterImage = rasterImage;
    lastUWind = uwind || null;
    lastVWind = vwind || null;
    if (uwind && vwind) {
        const windDef = weatherVariables['wind_u_10m'];
        lastUMin = typeof windDef.physMin === 'number' ? windDef.physMin : windDef.min;
        lastUMax = typeof windDef.physMax === 'number' ? windDef.physMax : windDef.max;
        const windDefV = weatherVariables['wind_v_10m'];
        lastVMin = typeof windDefV.physMin === 'number' ? windDefV.physMin : windDefV.min;
        lastVMax = typeof windDefV.physMax === 'number' ? windDefV.physMax : windDefV.max;
    }

    // If tooltip is pinned, re-sample on render to reflect new time/frame
    if (tooltipPinned && lastPickedLngLat) {
        try { updateTooltipAtLngLat(lastPickedLngLat[0], lastPickedLngLat[1]); } catch (err) { console.error('Re-sample failed:', err); }
    }

    // Update legend control with latest palette and unit
    try {
        const unit = (def && typeof def.unit === 'string') ? def.unit : '';
        await legendManager.updateConfig({ title: state.variable, unitFormat: { unit }, palette });
    } catch (err) {
        console.error('Legend update failed:', err);
    }
}

// Loading overlay and data cache (declared early to avoid TDZ in callbacks)
const overlay = new LoadingOverlay();
overlay.mount(document.body);
const dataCache = new DataCache({ maxConcurrency: 8, interBatchDelayMs: 50 });
let isCacheReady = false;
let currentLeadHours = 0;
let preloadToken = 0;
let progressTimer = null;

function countCachedFrames(variables, initKey, leads) {
    let done = 0;
    for (const variable of variables) {
        for (const lead of leads) {
            if (dataCache.get(variable, lead, initKey)) done++;
        }
    }
    return done;
}

async function preloadAll(state) {
    const myToken = ++preloadToken;
    const leads = leadsForFrequency(state.frequency);
    // Ensure current lead is valid, but do not reset if already valid
    if (!leads.includes(currentLeadHours)) {
        currentLeadHours = leads[0] || 0;
    }
    const initKey = getInitIndexFromState(state);
    const variablesAll = (state.variable === 'wind_speed_10m')
        ? ['wind_u_10m', 'wind_v_10m']
        : [state.variable, 'wind_u_10m', 'wind_v_10m'];
    const varsCount = variablesAll.length;
    // Track progress in hours for display, but keep completion based on all variables
    const itemsTotal = leads.length * varsCount;
    const hoursTotal = leads.length;
    const missingCount = variablesAll.reduce((accVars, variable) => accVars + (
        leads.reduce((accLeads, lead) => accLeads + (dataCache.get(variable, lead, initKey) ? 0 : 1), 0)
    ), 0);
    if (missingCount > 0 && myToken === preloadToken) {
        overlay.show(hoursTotal);
        // reflect already-cached frames and start polling progress from cache (all variables)
        const initialItemsDone = itemsTotal - missingCount;
        overlay.tick(Math.floor(initialItemsDone / varsCount));
        await new Promise(requestAnimationFrame);
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
        progressTimer = setInterval(() => {
            if (myToken !== preloadToken) return; // ignore outdated
            const itemsDone = countCachedFrames(variablesAll, initKey, leads);
            overlay.tick(Math.floor(itemsDone / varsCount));
            if (itemsDone >= itemsTotal) {
                clearInterval(progressTimer);
                progressTimer = null;
                overlay.hide();
            }
        }, 150);
    }
    isCacheReady = false;
    try {
        // 1) Prime: ensure current lead for selected variable and winds are cached first
        // Prime: fetch the 12-hour chunk that contains the current lead first
        const allLeads = leads;
        const idx = Math.max(0, allLeads.indexOf(currentLeadHours));
        const chunkStart = Math.max(0, Math.floor(idx / LEAD_CHUNK_SIZE) * LEAD_CHUNK_SIZE);
        const leadsPrime = allLeads.slice(chunkStart, chunkStart + LEAD_CHUNK_SIZE);
        if (DEBUG_ORDER) console.log('[ORDER][PRIME]', { currentLeadHours, initKey, leadsPrime });
        await dataCache.preload({
            variables: variablesAll,
            initKey,
            leads: leadsPrime,
            buildUrl: (variable, leadsChunk) => buildMultiUrl(variable, leadsChunk, initKey),
            fetchData: (url) => fetchFrames(url),
            onProgress: () => {},
            chunkSize: LEAD_CHUNK_SIZE
        });
        // Render immediately after prime
        if (myToken === preloadToken) {
            renderFromCache(state, currentLeadHours);
        }

        // 2) Continue: preload remaining frames for selected variable and winds together
        await dataCache.preload({
            variables: variablesAll,
            initKey,
            leads,
            buildUrl: (variable, leadsChunk) => buildMultiUrl(variable, leadsChunk, initKey),
            fetchData: (url) => fetchFrames(url),
            onProgress: () => {},
            chunkSize: LEAD_CHUNK_SIZE
        });
        isCacheReady = true;
    } catch (err) {
        // Surface error per rules
        console.error('Preload failed:', err);
        throw err;
    } finally {
        // Hide only if everything is present (all variables across all leads), regardless of hour display
        if (myToken === preloadToken && !progressTimer) {
            const allPresent = variablesAll.every((variable) => leads.every((lead) => dataCache.get(variable, lead, initKey)));
            if (allPresent) overlay.hide();
        }
    }
}

// Time slider UI
const timeSlider = new TimeSlider({
    onChange: (leadHours) => {
        if (DEBUG_ORDER) console.log('[ORDER][SLIDER]', { requestedLead: leadHours });
        currentLeadHours = leadHours;
        if (isCacheReady) renderFromCache(menu.getState(), leadHours);
    }
});
timeSlider.mount(document.body);

// Create the menu and wire it to the slider and rendering
const menu = new MenuBar({
    initialState: {
        initData: '',
        frequency: '24h',
			variable: 'wind_speed_10m',
        colormapGenre: 'cmocean',
        colormap: 'thermal'
    },
    onChange: async (state, meta) => {
        if (!INIT_ISOS_ASC || !state.initData) {
            // Defer any actions until init times are loaded and initData is set
            return;
        }
        timeSlider.setFromMenuState(state);
        if (meta && meta.requiresPreload) {
            await preloadAll(state);
        }
        renderFromCache(state, currentLeadHours);
    }
});
menu.mount(document.body);

// Initialize slider from current menu state
timeSlider.setFromMenuState(menu.getState());

// After first paint, load init-time range and kick off first preload+render
requestAnimationFrame(async () => {
    try {
        await loadInitRange();
        menu.setState({ initData: latestISO });
    } catch (err) {
        console.error('Failed to load init-time range:', err);
        throw err;
    }
});

// Initialize legend placement and react to menu open/close
legendManager.position();
document.addEventListener('click', (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.pf-menubar-open') || target.closest('.pf-menubar-close')) {
        // Wait for menu to toggle then reposition
        setTimeout(() => { legendManager.position(); }, 0);
    }
});

function sampleIndexForLngLat(lng, lat, width, height) {
    const minLon = bounds[0], minLat = bounds[1], maxLon = bounds[2], maxLat = bounds[3];
    const x = Math.round(((lng - minLon) / (maxLon - minLon)) * (width - 1));
    const y = Math.round(((maxLat - lat) / (maxLat - minLat)) * (height - 1));
    const xi = Math.max(0, Math.min(width - 1, x));
    const yi = Math.max(0, Math.min(height - 1, y));
    return yi * width + xi;
}

function sampleScalarAt(lng, lat) {
    if (!lastRasterImage || !lastRasterImage.data) throw new Error('Raster image not available for sampling');
    const { data, width, height } = lastRasterImage;
    const idx = sampleIndexForLngLat(lng, lat, width, height);
    return data[idx];
}

function sampleDirectionAt(lng, lat) {
    if (!lastUWind || !lastVWind) throw new Error('Wind vector data not available');
    if (lastUWind.width !== lastVWind.width || lastUWind.height !== lastVWind.height) throw new Error('Wind U/V dimensions mismatch');
    const width = lastUWind.width, height = lastUWind.height;
    const idx = sampleIndexForLngLat(lng, lat, width, height);
    const u = lastUMin + (lastUWind.data[idx] / 255) * (lastUMax - lastUMin);
    const v = lastVMin + (lastVWind.data[idx] / 255) * (lastVMax - lastVMin);
    const deg = (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360; // from which it blows
    return Math.round(deg);
}

function updateTooltipAtLngLat(lng, lat) {
    const value = sampleScalarAt(lng, lat);
    let direction = undefined;
    try { direction = sampleDirectionAt(lng, lat); } catch {}
    const pt = map.project([lng, lat]);
    tooltipManager.updateAtPixel(pt.x, pt.y, value, direction);
}

// Update tooltip position when map moves/zooms
map.on('move', () => {
    if (tooltipPinned && lastPickedLngLat) {
        try { updateTooltipAtLngLat(lastPickedLngLat[0], lastPickedLngLat[1]); } catch (err) { console.error('Move update failed:', err); }
    }
});

// Click-to-pin tooltip
map.on('click', (e) => {
    try {
        updateTooltipUnitFormat(menu.getState().variable);
        updateTooltipAtLngLat(e.lngLat.lng, e.lngLat.lat);
        tooltipPinned = true;
        lastPickedLngLat = [e.lngLat.lng, e.lngLat.lat];
    } catch (err) {
        console.error('Tooltip sample failed:', err);
        throw err;
    }
});

// Esc to clear pinned tooltip
window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
        tooltipPinned = false;
        lastPickedLngLat = null;
        tooltipManager.clear();
    }
});


// only JS code here...
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import basemapStyle from './assets/basemapstyle.json';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

import { combineWindBytesToImage, computeWindSpeedFromUVBytes, createCMAP, createCategoricalPalette, fetchInitTimeRange, parseInitTimeToDate, generateInitTimes6h, getLocationFromIP } from './util.js';
import { MenuBar } from '@menu_bar/menubar.js';
import '@menu_bar/menubar.css';
import { TimeSlider } from '@time_slider/timeslider.js';
import '@time_slider/timeslider.css';
import './loading_overlay/loading.css';
import { DataCache } from './data/cache.js';
import weatherVariables from './assets/weather_variables.json';
import { createLegendManager } from './controls/legend.js';
import { createTooltipManager } from './controls/tooltip.js';
import { RoutingControl } from './controls/routing.js';
import { startTour } from './controls/tour.js';
import { initAuth } from './auth/clerk.js';
import './index.css'; // Import global CSS for location dot

// Unit conversion helpers (affine y = a*x + b) derived from weather_variables.json per variable
function getUnitConv(def, unit) {
    if (!def) throw new Error('Missing variable definition');
    const native = def.unit;
    const chosen = unit || def.defaultUnit || native;
    if (!chosen || chosen === native) {
        return { fromNative: { a: 1, b: 0 }, toNative: { a: 1, b: 0 }, unit: native };
    }
    if (!def.convert || !def.convert[chosen]) {
        throw new Error(`Unsupported unit ${chosen} for ${def.commonName || 'variable'}`);
    }
    const conv = def.convert[chosen];
    return { fromNative: conv.fromNative || { a: 1, b: 0 }, toNative: conv.toNative || { a: 1, b: 0 }, unit: chosen };
}

function convertValue(a, b, x) { return a * x + b; }
function convertAffineArrayFloat32(src, a, b) {
    const out = new Float32Array(src.length);
    for (let i = 0; i < src.length; i++) out[i] = a * src[i] + b;
    return out;
}

// Precision helper mirrored from menubar for consistent UI formatting
function getPrecisionForUnit(def, unit) {
    if (!def) return 0;
    if (def.precisions && Number.isFinite(def.precisions[unit])) {
        const p = def.precisions[unit];
        return Math.max(0, Math.floor(p));
    }
    try {
        const { fromNative } = getUnitConv(def, unit || (def.defaultUnit || def.unit));
        const physMinNative = typeof def.physMin === 'number' ? def.physMin : def.min;
        const physMaxNative = typeof def.physMax === 'number' ? def.physMax : def.max;
        const physMin = convertValue(fromNative.a, fromNative.b, Number(physMinNative));
        const physMax = convertValue(fromNative.a, fromNative.b, Number(physMaxNative));
        const countDecimals = (n) => {
            if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
            const s = String(n);
            const parts = s.split('.');
            return parts.length > 1 ? parts[1].length : 0;
        };
        return Math.max(countDecimals(physMin), countDecimals(physMax), 0);
    } catch {
        return 0;
    }
}

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

const map = new mapboxgl.Map({
    container: 'map', // container id
    style: basemapStyle, // local style
    center: [12, -10], // starting position [lng, lat]

    zoom: 2.5, // starting zoom
    minZoom: 2,
    maxZoom: 15
});

const routingControl = new RoutingControl(map);
// Remove initial mount here, we will mount it inside the menu stack later
// routingControl.mount(document.body);
routingControl.onRouteLoaded((leadHours) => {
    if (timeSlider) {
        timeSlider.setLeadHour(leadHours);
    }
});

// Help Button creation moved to after MenuBar mount


// Check if first visit
if (!localStorage.getItem('pf-tour-shown')) {
    setTimeout(() => {
        startTour();
        localStorage.setItem('pf-tour-shown', 'true');
    }, 1000); // Small delay to let UI settle
}

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
const tooltipManager = createTooltipManager({
    getDeckOverlay: () => deckOverlay,
    onClose: () => {
        tooltipPinned = false;
        lastPickedLngLat = null;
        tooltipManager.clear();
    }
});

function updateTooltipUnitFormat(unitString) {
    const unit = typeof unitString === 'string' ? unitString : '';
    try {
        const state = menu.getState();
        const def = weatherVariables[state.variable];
        const chosenUnit = unit || (def && (def.defaultUnit || def.unit)) || '';
        const precision = getPrecisionForUnit(def, chosenUnit);
        tooltipManager.updateUnit({ unit: chosenUnit, precision });
    } catch {
        try { tooltipManager.updateUnit(unit); } catch {}
    }
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
        return frames;
    }
    throw new Error(`Unexpected array shape from API: ${JSON.stringify(shape)}`);
}

const API_BASE = 'https://api.offshoreweatherrouting.com';
// Configuration: number of lead_time slices per request
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
// Hour 121/122 are not valid (no data); Errors are raised to avoid silent fallbacks.
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

    // Select U/V pair for vectors and potential scalar derivation
    const use100m = (state.variable === 'wind_speed_100m');
    const uKey = use100m ? 'wind_u_100m' : 'wind_u_10m';
    const vKey = use100m ? 'wind_v_100m' : 'wind_v_10m';
    const uwind = dataCache.get(uKey, leadHours, initKey);
    const vwind = dataCache.get(vKey, leadHours, initKey);

    // If wind speed is requested, compute from U and V instead of fetching from server
    if ((state.variable === 'wind_speed_10m' || state.variable === 'wind_speed_100m') && uwind && vwind) {
        const uDef = weatherVariables[uKey];
        const vDef = weatherVariables[vKey];
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

    // Convert Uint8 raster to Float32 physical values before passing to the layer (native units)
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

    // If wind speed is derived above (Float32), it is in native m/s already.

    // Convert from native units to selected unit for display and interactions
    const { fromNative } = getUnitConv(def, state.unit);
    if (rasterImage && rasterImage.data instanceof Float32Array) {
        rasterImage = { data: convertAffineArrayFloat32(rasterImage.data, fromNative.a, fromNative.b), width: rasterImage.width, height: rasterImage.height };
    }

    await ensureDeckOverlay();
    const { RasterLayer, ParticleLayer, ClipExtension } = await ensureLayerModules();

    const raster = new RasterLayer({
        id: 'raster',
        image: rasterImage,
        imageMinValue: convertValue(fromNative.a, fromNative.b, (typeof def.physMin === 'number' ? def.physMin : def.min)),
        imageMaxValue: convertValue(fromNative.a, fromNative.b, (typeof def.physMax === 'number' ? def.physMax : def.max)),
        bounds: bounds,
        palette: palette,
        extensions: [new ClipExtension()],
        clipBounds: bounds,
        opacity: 1,
        pickable: true,
        beforeId: 'earth'
    });

    const layers = [raster];
    if (uwind && vwind && vectorWind) {
        const windDef = weatherVariables[uKey];
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

    // Keep last-rendered data for value picking
    lastRasterImage = rasterImage;
    lastUWind = uwind || null;
    lastVWind = vwind || null;
    if (uwind && vwind) {
        const windDef = weatherVariables[uKey];
        lastUMin = typeof windDef.physMin === 'number' ? windDef.physMin : windDef.min;
        lastUMax = typeof windDef.physMax === 'number' ? windDef.physMax : windDef.max;
        const windDefV = weatherVariables[vKey];
        lastVMin = typeof windDefV.physMin === 'number' ? windDefV.physMin : windDefV.min;
        lastVMax = typeof windDefV.physMax === 'number' ? windDefV.physMax : windDefV.max;
    }

    // If tooltip is pinned, re-sample on render to reflect new time/frame
    if (tooltipPinned && lastPickedLngLat) {
        try { updateTooltipAtLngLat(lastPickedLngLat[0], lastPickedLngLat[1]); } catch (err) { console.error('Re-sample failed:', err); }
    }

    // Update legend control with latest palette and unit
    try {
        const unit = (typeof state.unit === 'string') ? state.unit : (def && typeof def.unit === 'string' ? def.unit : '');
        const title = (def && def.commonName) ? def.commonName : state.variable;
        await legendManager.updateConfig({ title, unitFormat: { unit }, palette });
    } catch (err) {
        console.error('Legend update failed:', err);
    }
}

// Data cache (declared early to avoid TDZ in callbacks)
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

function updateTimeSliderConstraint(state, leads) {
    // Calculate the maximum contiguous lead available from the start.
    // Iterates through leads from index 0. If a lead is fully loaded (all variables), continues.
    // Stops at the first gap. The last fully loaded index defines the available range limit.
    
    if (!leads || leads.length === 0) return;
    
    const initKey = getInitIndexFromState(state);
    const variablesAll = (state.variable === 'wind_speed_10m')
        ? ['wind_u_10m', 'wind_v_10m']
        : (state.variable === 'wind_speed_100m'
            ? ['wind_u_100m', 'wind_v_100m', 'wind_u_10m', 'wind_v_10m']
            : [state.variable, 'wind_u_10m', 'wind_v_10m']);
        
    let maxIndex = -1;
    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        let allVarsLoaded = true;
        for (const variable of variablesAll) {
            if (!dataCache.get(variable, lead, initKey)) {
                allVarsLoaded = false;
                break;
            }
        }
        if (allVarsLoaded) {
            maxIndex = i;
        } else {
            // Stops at the first gap to enforce contiguity, ensuring the user cannot skip over unloaded data.
            break; 
        }
    }
    
    if (maxIndex >= 0) {
        timeSlider.setAvailableRange(maxIndex);
    } else {
        // Defaults to 0 if no leads are fully loaded.
        timeSlider.setAvailableRange(0); 
    }
}

async function preloadAll(state) {
	// Cancel any in-flight preloads to free bandwidth/resources
	try { dataCache.abortAll(); } catch {}
	const myToken = ++preloadToken;
    const leads = leadsForFrequency(state.frequency);
    // Ensure current lead is valid, but do not reset if already valid
    if (!leads.includes(currentLeadHours)) {
        currentLeadHours = leads[0] || 0;
    }
    const initKey = getInitIndexFromState(state);
    const variablesAll = (state.variable === 'wind_speed_10m')
        ? ['wind_u_10m', 'wind_v_10m']
        : (state.variable === 'wind_speed_100m'
            ? ['wind_u_100m', 'wind_v_100m', 'wind_u_10m', 'wind_v_10m']
            : [state.variable, 'wind_u_10m', 'wind_v_10m']);
    const varsCount = variablesAll.length;

    // Split leads into foreground (<= 12h) and background (> 12h)
    const initialLeads = leads.filter(h => h <= 12);
    const bgLeads = leads.filter(h => h > 12);

    // --- Phase 1: Foreground Load ---
    const initialMissing = variablesAll.reduce((accVars, variable) => accVars + (
        initialLeads.reduce((accLeads, lead) => accLeads + (dataCache.get(variable, lead, initKey) ? 0 : 1), 0)
    ), 0);

	// Pre-compute background missing for unified progress
	const bgMissingPre = variablesAll.reduce((accVars, variable) => accVars + (
		bgLeads.reduce((accLeads, lead) => accLeads + (dataCache.get(variable, lead, initKey) ? 0 : 1), 0)
	), 0);
	const totalToLoad = initialMissing + bgMissingPre;

    // Update slider constraint initially (likely 0 or cached amount)
    updateTimeSliderConstraint(state, leads);
	// Clear any previous inline error and prime unified spinner
	timeSlider.setInlineError('');
	if (totalToLoad > 0) {
		timeSlider.setBackgroundLoading(true, 0, totalToLoad);
	} else {
		timeSlider.setBackgroundLoading(false);
	}

    if (initialMissing > 0 && myToken === preloadToken) {
        try {
            await dataCache.preload({
                variables: variablesAll,
                initKey,
                leads: initialLeads,
                buildUrl: (variable, leadsChunk) => buildMultiUrl(variable, leadsChunk, initKey),
				fetchData: (url) => fetchFrames(url),
				onProgress: (doneFg /*, totalFg */) => {
                    if (myToken !== preloadToken) return;
                    // Keep slider constraint tight while the foreground frames arrive.
                    updateTimeSliderConstraint(state, leads);
					// Unified progress: foreground completes first segment
					const clampedDone = Math.min(doneFg, initialMissing);
					timeSlider.setBackgroundLoading(true, clampedDone, totalToLoad || clampedDone);
                },
				chunkSize: LEAD_CHUNK_SIZE,
				token: myToken
            });
        } catch (err) {
            console.error('Foreground preload failed:', err);
			try { timeSlider.setInlineError('Initial load failed'); } catch {}
            throw err;
        }
    }

    if (myToken !== preloadToken) return;

    // Render immediately and unlock UI
    isCacheReady = true;
    updateTimeSliderConstraint(state, leads); // Should cover initialLeads now
    renderFromCache(state, currentLeadHours);

    // --- Phase 2: Background Load (Non-blocking) ---
	if (bgLeads.length > 0 && bgMissingPre > 0) {
		// Fire and forget with unified progress
		dataCache.preload({
			variables: variablesAll,
			initKey,
			leads: bgLeads,
			buildUrl: (variable, leadsChunk) => buildMultiUrl(variable, leadsChunk, initKey),
			fetchData: (url) => fetchFrames(url),
			onProgress: (doneBg /*, totalBg */) => {
				if (myToken !== preloadToken) return;
				const fgDone = initialMissing;
				const combinedDone = Math.min(fgDone + doneBg, totalToLoad);
				timeSlider.setBackgroundLoading(true, combinedDone, totalToLoad || combinedDone);
				updateTimeSliderConstraint(state, leads);
			},
			chunkSize: LEAD_CHUNK_SIZE,
			token: myToken
		}).then(() => {
			if (myToken === preloadToken) {
				timeSlider.setBackgroundLoading(false);
				updateTimeSliderConstraint(state, leads);
			}
		}).catch(err => {
			console.error('Background preload failed:', err);
			if (myToken === preloadToken) {
				try { timeSlider.setInlineError('Background load failed'); } catch {}
				timeSlider.setBackgroundLoading(false);
			}
		});
	} else {
		timeSlider.setBackgroundLoading(false);
	}
}

// Time slider UI
const timeSlider = new TimeSlider({
    onChange: (leadHours) => {
        currentLeadHours = leadHours;
        if (isCacheReady) renderFromCache(menu.getState(), leadHours);
        
        // Update routing boat position
        if (routingControl && menu) {
            const state = menu.getState();
            if (state.initData) {
                const initTime = new Date(state.initData).getTime();
                const targetTime = new Date(initTime + leadHours * 3600 * 1000);
                routingControl.setCurrentTime(targetTime.toISOString());
            }
        }
    }
});
timeSlider.mount(document.body);

// Create the menu and wire it to the slider and rendering
const menu = new MenuBar({
    initialState: {
        initData: '',
        frequency: '5d',
			variable: 'wind_speed_10m',
        colormapGenre: 'cmocean',
        colormap: 'thermal',
        showLocalTime: true
    },
    onChange: async (state, meta) => {
        if (!INIT_ISOS_ASC || !state.initData) {
            // Defer any actions until init times are loaded and initData is set
            return;
        }
        // Pass available leads to routing control for the dropdown
        if (routingControl) {
            const leads = leadsForFrequency(state.frequency);
            if (typeof routingControl.setShowLocalTime === 'function') {
                routingControl.setShowLocalTime(!!state.showLocalTime);
            }
            if (typeof routingControl.setFrequency === 'function') {
                routingControl.setFrequency(state.frequency);
            }
            routingControl.setTimeOptions(leads, state.initData);
            
            // Pass init time index to routing control API
            if (INIT_ISOS_ASC) {
                const idx = getInitIndexFromState(state);
                routingControl.setInitTimeIndex(idx);
            }
        }
        
        timeSlider.setFromMenuState(state);
        
        // Update routing boat position if init time changed
        if (routingControl && state.initData) {
             // currentLeadHours is global state tracked from slider
             const initTime = new Date(state.initData).getTime();
             const targetTime = new Date(initTime + currentLeadHours * 3600 * 1000);
             routingControl.setCurrentTime(targetTime.toISOString());
        }

        if (meta && meta.requiresPreload) {
            await preloadAll(state);
        }
        renderFromCache(state, currentLeadHours);
    },
    onToggle: (isOpen) => {
        // Update legend position/visibility immediately
        setTimeout(() => { legendManager.position(); }, 0);
    }
});
menu.mount(document.body);

// Create Help Button and append to MenuBar container
const helpBtn = document.createElement('div');
helpBtn.className = 'pf-help-btn';
helpBtn.textContent = '?';
helpBtn.onclick = () => startTour();
if (menu.root) {
    // Mount Routing Control into MenuBar container
    // It should be below weather menu and above profile/help
    routingControl.mount(menu.root);

    menu.root.appendChild(helpBtn);
    // Initialize Auth (will insert profile button before help button)
    initAuth(menu.root);
} else {
    document.body.appendChild(helpBtn);
    // Fallback if menu root not ready
    initAuth(document.body);
    routingControl.mount(document.body); // Fallback to body mount
}

// Initialize slider from current menu state
timeSlider.setFromMenuState(menu.getState());

// Initialize routing control time options
const initialLeads = leadsForFrequency(menu.getState().frequency);
routingControl.setTimeOptions(initialLeads, menu.getState().initData);

// After first paint, load init-time range and kick off first preload+render
requestAnimationFrame(async () => {
    try {
        await loadInitRange();
        menu.setState({ initData: latestISO });
        // Also update routing options now that we have initData
        const leads = leadsForFrequency(menu.getState().frequency);
        if (typeof routingControl.setShowLocalTime === 'function') {
            routingControl.setShowLocalTime(!!menu.getState().showLocalTime);
        }
        if (typeof routingControl.setFrequency === 'function') {
            routingControl.setFrequency(menu.getState().frequency);
        }
        routingControl.setTimeOptions(leads, latestISO);
        
        // Default latest is the last index
        if (INIT_ISOS_ASC) {
            routingControl.setInitTimeIndex(INIT_ISOS_ASC.length - 1);
        }
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

function formatCoord(deg, isLat) {
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    // Fix to 1 decimal place as requested
    const m = ((abs - d) * 60).toFixed(1);
    const suffix = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
    // Pad minutes with leading zero if needed (e.g. 05.1)
    const mStr = m.length < 4 ? '0' + m : m;
    return `${d}° ${mStr}' ${suffix}`;
}

function updateTooltipAtLngLat(lng, lat) {
    const value = sampleScalarAt(lng, lat);
    let direction = undefined;
    try { direction = sampleDirectionAt(lng, lat); } catch {}
    const pt = map.project([lng, lat]);
    
    // Format coords for tooltip "unit" hack
    const coordText = `${formatCoord(lat, true)} ${formatCoord(lng, false)}`;
    
    // Pass coordText as extraLabel
    tooltipManager.updateAtPixel(pt.x, pt.y, value, direction, coordText);
}

// Update tooltip position when map moves/zooms
map.on('move', () => {
    if (tooltipPinned && lastPickedLngLat && lastRasterImage) {
        try { updateTooltipAtLngLat(lastPickedLngLat[0], lastPickedLngLat[1]); } catch (err) { console.error('Move update failed:', err); }
    }
});

// Click-to-pin tooltip
map.on('click', (e) => {
    // Avoid showing tooltip if routing context menu was just opened (long press or right click)
    if (routingControl && typeof routingControl.isContextMenuActive === 'function' && routingControl.isContextMenuActive()) {
        return;
    }
    try {
        updateTooltipUnitFormat(menu.getState().unit);
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

// Helper function to apply location to map
function applyLocation(longitude, latitude, zoom = 6) {
    // Center map
    map.flyTo({
        center: [longitude, latitude],
        zoom: zoom
    });

    // Add blue dot marker
    const dot = document.createElement('div');
    dot.className = 'pf-location-dot';
    new mapboxgl.Marker({ element: dot })
        .setLngLat([longitude, latitude])
        .addTo(map);

    // Default routing start to user location
    if (routingControl) {
        routingControl.setStart([longitude, latitude]);
    }

    // Activate picker
    tooltipPinned = true;
    lastPickedLngLat = [longitude, latitude];
    
    try {
        updateTooltipUnitFormat(menu.getState().unit);
        updateTooltipAtLngLat(longitude, latitude);
    } catch (e) {
        // Data not ready yet, will be handled by render loop
    }
}


// Auto-geolocation
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { longitude, latitude } = position.coords;
            applyLocation(longitude, latitude, 6);
        },
        async (error) => {
            // Geolocation failed or denied, try IP geolocation fallback
            console.log('Geolocation failed, trying IP fallback:', error.message);
            const location = await getLocationFromIP();
            if (location) {
                // Use country/continent level location with lower zoom
                applyLocation(location.longitude, location.latitude, 4);
            }
        }
    );
} else {
    // Geolocation not supported, try IP geolocation fallback
    getLocationFromIP().then(location => {
        if (location) {
            // Use country/continent level location with lower zoom
            applyLocation(location.longitude, location.latitude, 4);
        }
    });
}

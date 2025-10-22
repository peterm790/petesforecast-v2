// only JS code here...
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import basemapStyle from './assets/basemapstyle.json';
import { createVectorWindImage, createCMAP, fetchInitTimeRange, parseInitTimeToDate, generateInitTimes6h } from './util.js';
import { MenuBar } from '@menu_bar/menubar.js';
import '@menu_bar/menubar.css';
import { TimeSlider } from '@time_slider/timeslider.js';
import '@time_slider/timeslider.css';
import { LoadingOverlay } from './loading_overlay/loading.js';
import './loading_overlay/loading.css';
import { DataCache } from './data/cache.js';
import NPY from 'npyjs';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { RasterLayer, ParticleLayer } from 'weatherlayers-gl';
import { ClipExtension } from '@deck.gl/extensions';
import weatherVariables from './assets/weather_variables.json';

const [firstStr, latestStr] = await fetchInitTimeRange();
const sixHourlyDates = generateInitTimes6h(firstStr, latestStr);
const latestISO = parseInitTimeToDate(latestStr).toISOString().replace('.000Z', 'Z');

function toIsoZ(d) { return d.toISOString().replace('.000Z', 'Z'); }
const INIT_ISOS_ASC = sixHourlyDates.map(toIsoZ);
function getInitIndexFromState(state) {
    const iso = state.initData;
    const idx = INIT_ISOS_ASC.indexOf(iso);
    if (idx === -1) throw new Error(`Unknown init: ${iso}`);
    return idx; // earliest=0 ... latest=max
}

const bounds = [-180.125, -90.125, 179.875, 90.125];
const map = new maplibregl.Map({
    container: 'map', // container id
    style: basemapStyle, // local style
    center: [0, 0], // starting position [lng, lat]
    zoom: 2 // starting zoom
});

// deck.gl overlay interleaved with MapLibre
const deckOverlay = new MapboxOverlay({
    interleaved: true,
    layers: []
});
map.addControl(deckOverlay);

async function fetchData(url, signal) {
    const response = await fetch(url, { method: 'GET', signal });
    if (!response.ok) {
        throw new Error(`Request failed with ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const npy = new NPY();
    const { data: flat, shape } = await npy.load(arrayBuffer);

    const height = shape[1];
    const width = shape[2];
    const planeSize = width * height;

    return { data: flat.subarray(0, planeSize), width, height };
}

function buildRasterUrl(variableKey, lead, initIndex) {
    return `https://iyb260zpcg.execute-api.us-west-2.amazonaws.com/bbox/-180.125,-90.125,179.875,90.125.npy?url=https%3A%2F%2Fdata.dynamical.org%2Fnoaa%2Fgfs%2Fforecast%2Flatest.zarr&variable=${encodeURIComponent(variableKey)}&isel=init_time%3D${encodeURIComponent(initIndex)}&isel=lead_time%3D${encodeURIComponent(lead)}&decode_times=true`;
}

function buildWindUrl(varKey, lead, initIndex) {
    return `https://iyb260zpcg.execute-api.us-west-2.amazonaws.com/bbox/-180.125,-90.125,179.875,90.125.npy?url=https%3A%2F%2Fdata.dynamical.org%2Fnoaa%2Fgfs%2Fforecast%2Flatest.zarr&variable=${encodeURIComponent(varKey)}&isel=init_time%3D${encodeURIComponent(initIndex)}&isel=lead_time%3D${encodeURIComponent(lead)}&decode_times=true`;
}

function leadsForFrequency(freq) {
    if (freq === '3d') return Array.from({ length: 73 }, (_, i) => i);
    if (freq === '5d') return Array.from({ length: 121 }, (_, i) => i);
    if (freq === '16d-3h') return Array.from({ length: 129 }, (_, i) => i * 3);
    throw new Error(`Unknown frequency: ${freq}`);
}

async function renderFromCache(state, leadHours) {
    const def = weatherVariables[state.variable];
    if (!def) throw new Error(`Unknown weather variable: ${state.variable}`);
    const dataMin = typeof state.dataMin === 'number' ? state.dataMin : def.min;
    const dataMax = typeof state.dataMax === 'number' ? state.dataMax : def.max;
    const initKey = getInitIndexFromState(state);
    const rasterData = dataCache.get(state.variable, leadHours, initKey);
    const uwind = dataCache.get('wind_u_10m', leadHours, initKey);
    const vwind = dataCache.get('wind_v_10m', leadHours, initKey);
    if (!rasterData) {
        console.warn('Cache not ready for lead', leadHours, { hasVar: !!rasterData, hasU: !!uwind, hasV: !!vwind });
        return; // wait until variable is cached
    }
    const palette = await createCMAP(state.colormapGenre, state.colormap, dataMin, dataMax);
    let vectorWind = null;
    if (uwind && vwind) {
        vectorWind = await createVectorWindImage(uwind, vwind);
    }

    const raster = new RasterLayer({
        id: 'raster',
        image: rasterData,
        imageMinValue: dataMin * 0.9999, // just avoids weird artifacts
        imageMaxValue: dataMax * 1.0001, // just avoids weird artifacts
        bounds: bounds,
        palette: palette,
        extensions: [new ClipExtension()],
        clipBounds: [-181, -85.051129, 181, 85.051129],
        opacity: 0.6,
        beforeId: 'physical_line_stream'
    });

    const layers = [raster];
    if (uwind && vwind && vectorWind) {
        const particle = new ParticleLayer({
            id: 'particle',
            image: vectorWind,
            bounds: bounds,
            imageUnscale: [-30, 30],
            extensions: [new ClipExtension()],
            clipBounds: [-181, -85.051129, 181, 85.051129],
            numParticles: 4000,
            maxAge: 12,
            speedFactor: 7,
            width: 2,
            color: [255, 255, 255],
            opacity: 0.6,
            animate: true
        });
        layers.push(particle);
    }

    deckOverlay.setProps({ layers });
}

// Loading overlay and data cache (declared early to avoid TDZ in callbacks)
const overlay = new LoadingOverlay();
overlay.mount(document.body);
const dataCache = new DataCache({ maxConcurrency: 100 });
let isCacheReady = false;
let currentLeadHours = 0;
let preloadToken = 0;
let progressTimer = null;

function countCachedFrames(variable, initKey, leads) {
    let done = 0;
    for (const lead of leads) {
        if (dataCache.get(variable, lead, initKey)) done++;
    }
    return done;
}

async function preloadAll(state) {
    const myToken = ++preloadToken;
    const leads = leadsForFrequency(state.frequency);
    // Ensure current lead is valid
    currentLeadHours = leads[0] || 0;
    const initKey = getInitIndexFromState(state);
    // Show only if not fully cached for this variable
    const total = leads.length; // spinner tracks selected variable only
    const missingCount = leads.reduce((acc, lead) => acc + (
        (dataCache.get(state.variable, lead, initKey) ? 0 : 1)
    ), 0);
    if (missingCount > 0 && myToken === preloadToken) {
        overlay.show(total);
        // reflect already-cached frames and start polling progress from cache
        overlay.tick(total - missingCount);
        await new Promise(requestAnimationFrame);
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
        progressTimer = setInterval(() => {
            if (myToken !== preloadToken) return; // ignore outdated
            const done = countCachedFrames(state.variable, initKey, leads);
            overlay.tick(done);
            if (done >= total) {
                clearInterval(progressTimer);
                progressTimer = null;
                overlay.hide();
            }
        }, 150);
    }
    isCacheReady = false;
    try {
        // 1) Prime: ensure current lead for selected variable is cached first
        if (!dataCache.get(state.variable, currentLeadHours, initKey)) {
            await dataCache.preload({
                variables: [state.variable],
                initKey,
                leads: [currentLeadHours],
                buildUrl: (variable, lead) => buildRasterUrl(variable, lead, initKey),
                fetchData: (url) => fetchData(url),
                onProgress: () => {}
            });
        }
        // Render immediately after prime (variable before wind)
        if (myToken === preloadToken) {
            renderFromCache(state, currentLeadHours);
        }

        // 2) Continue: preload remaining variable frames with spinner polling
        await dataCache.preload({
            variables: [state.variable],
            initKey,
            leads,
            buildUrl: (variable, lead) => buildRasterUrl(variable, lead, initKey),
            fetchData: (url) => fetchData(url),
            onProgress: () => {}
        });
        // Kick off U/V in background without spinner
        dataCache.preload({
            variables: ['wind_u_10m', 'wind_v_10m'],
            initKey,
            leads,
            buildUrl: (variable, lead) => buildWindUrl(variable, lead, initKey),
            fetchData: (url) => fetchData(url),
            onProgress: () => {}
        }).catch(err => console.error('Background wind preload failed:', err));
        isCacheReady = true;
    } catch (err) {
        // Surface error per rules
        console.error('Preload failed:', err);
        throw err;
    } finally {
        // Hide only if everything is present
        if (myToken === preloadToken && !progressTimer) {
            const allPresent = leads.every((lead) => dataCache.get(state.variable, lead, initKey));
            if (allPresent) overlay.hide();
        }
    }
}


// Time slider UI
const timeSlider = new TimeSlider({
    onChange: (leadHours) => { currentLeadHours = leadHours; if (isCacheReady) renderFromCache(menu.getState(), leadHours); }
});
timeSlider.mount(document.body);

// Create the menu and wire it to the slider and rendering
const menu = new MenuBar({
    initialState: {
        initData: latestISO,
        frequency: '3d',
        variable: 'temperature_2m',
        colormapGenre: 'cmocean',
        colormap: 'thermal'
    },
    onChange: async (state) => {
        timeSlider.setFromMenuState(state);
        await preloadAll(state);
        renderFromCache(state, currentLeadHours);
    }
});
menu.mount(document.body);

// Initialize slider from current menu state, preload and render
timeSlider.setFromMenuState(menu.getState());
await preloadAll(menu.getState());
renderFromCache(menu.getState(), currentLeadHours);


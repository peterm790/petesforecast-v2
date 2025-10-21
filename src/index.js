// only JS code here...
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import basemapStyle from './assets/basemapstyle.json';
import { createVectorWindImage, createCMAP } from './util.js';
import NPY from 'npyjs';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { RasterLayer, ParticleLayer } from 'weatherlayers-gl';
import { ClipExtension } from '@deck.gl/extensions';

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

async function fetchData(url) {
    const response = await fetch(url, { method: 'GET' });
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

async function addWeatherLayer(rasterData, vectorWind, bounds) {
    const dataMin = -50;
    const dataMax = 50;
    const palette = await createCMAP('cmocean', 'thermal', dataMin, dataMax);

    const raster = new RasterLayer({
        id: 'raster',
        image: rasterData,
        imageMinValue:dataMin,
        imageMaxValue: dataMax,
        bounds: bounds,
        palette: palette,
        extensions: [new ClipExtension()],
        clipBounds: [-181, -85.051129, 181, 85.051129],
        opacity: 0.6,
        beforeId: 'physical_line_stream'
    });

    const particle = new ParticleLayer({
        id: 'particle',
        image: vectorWind,          // U component (east-west)
        //imageType: ImageType.VECTOR,
        bounds: bounds,
        imageUnscale: [-30, 30],
        extensions: [new ClipExtension()],
        clipBounds: [-181, -85.051129, 181, 85.051129],
        numParticles: 4000,
        maxAge: 10,
        speedFactor: 7,
        width: 2,
        color: [255, 255, 255], 
        opacity: 0.6,
        animate: true,
        // imageInterpolation: ImageInterpolation.CUBIC
    });

    deckOverlay.setProps({ layers: [raster, particle] });
}


const rasterData = await fetchData('https://iyb260zpcg.execute-api.us-west-2.amazonaws.com/bbox/-180.125,-90.125,179.875,90.125.npy?url=https%3A%2F%2Fdata.dynamical.org%2Fnoaa%2Fgfs%2Fforecast%2Flatest.zarr&variable=temperature_2m&isel=init_time%3D-1&isel=lead_time%3D0&decode_times=true');
let uwind = await fetchData('https://iyb260zpcg.execute-api.us-west-2.amazonaws.com/bbox/-180.125,-90.125,179.875,90.125.npy?url=https%3A%2F%2Fdata.dynamical.org%2Fnoaa%2Fgfs%2Fforecast%2Flatest.zarr&variable=wind_u_10m&isel=init_time%3D-1&isel=lead_time%3D0&decode_times=true');
let vwind = await fetchData('https://iyb260zpcg.execute-api.us-west-2.amazonaws.com/bbox/-180.125,-90.125,179.875,90.125.npy?url=https%3A%2F%2Fdata.dynamical.org%2Fnoaa%2Fgfs%2Fforecast%2Flatest.zarr&variable=wind_v_10m&isel=init_time%3D-1&isel=lead_time%3D0&decode_times=true');

const vectorWind = await createVectorWindImage(uwind, vwind);

addWeatherLayer(rasterData, vectorWind, bounds);


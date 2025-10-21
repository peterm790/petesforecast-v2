# geodesy-fn


[![](https://img.shields.io/npm/dm/geodesy-fn)](https://www.npmjs.com/package/geodesy-fn)
[![](https://img.shields.io/david/zakjan/geodesy-fn)](https://www.npmjs.com/package/geodesy-fn)
[![](https://img.shields.io/bundlephobia/min/geodesy-fn)](https://www.npmjs.com/package/geodesy-fn)

Geodesic functions for GeoJSON, based on [geodesy](https://github.com/chrisveness/geodesy).

Compared to [geodesy](https://github.com/chrisveness/geodesy), this library exports geodesic calculations as light-weight functions. The input/output is `GeoJSON.Position = [longitude, latitude]`.

Currently implemented functions from [geodesy](https://github.com/chrisveness/geodesy):

- spherical
    - `distance`
    - `initialBearing`
    - `finalBearing`
    - `midpoint`
    - `destinationPoint`

More functions from [geodesy](https://github.com/chrisveness/geodesy) can be added as needed.

## Install

```
npm install geodesy-fn
```

## Usage

```
import { distance } from 'geodesy-fn/src/spherical';

const p1 = [0.119, 52.205];
const p2 = [2.351, 48.857];
const d = distance(p1, p2);
```
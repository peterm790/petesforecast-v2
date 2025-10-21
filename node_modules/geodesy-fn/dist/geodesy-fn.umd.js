(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GeodesyFn = {}));
})(this, (function (exports) { 'use strict';

  const DEFAULT_RADIUS = 6371e3;
  function equals(position1, position2) {
      if (Math.abs(position1[0] - position2[0]) > Number.EPSILON)
          return false;
      if (Math.abs(position1[1] - position2[1]) > Number.EPSILON)
          return false;
      return true;
  }
  function toRadians(value) {
      return value / 180 * Math.PI;
  }
  function toDegrees(value) {
      return value / Math.PI * 180;
  }

  function wrap360(value) {
      return (value + 360) % 360;
  }

  /**
   * Returns the distance along the surface of the earth from start point to destination point.
   *
   * Uses haversine formula: a = sin²(Δφ/2) + cosφ1·cosφ2 · sin²(Δλ/2); d = 2 · atan2(√a, √(a-1)).
   *
   * @param   {GeoJSON.Position} start - Longitude/latitude of start point.
   * @param   {GeoJSON.Position} destination - Longitude/latitude of destination point.
   * @param   {number} [radius] - Radius of earth (defaults to mean radius in metres).
   * @returns {number} Distance between start point and destination point, in same units as radius.
   *
   * @example
   *   const p1 = [0.119, 52.205];
   *   const p2 = [2.351, 48.857];
   *   const d = distance(p1, p2);         // 404.3×10³ m
   *   const m = distanceTo(p1, p2, 3959); // 251.2 miles
   */
  function distance(start, destination, radius = DEFAULT_RADIUS) {
      // a = sin²(Δφ/2) + cos(φ1)⋅cos(φ2)⋅sin²(Δλ/2)
      // δ = 2·atan2(√(a), √(1−a))
      // see mathforum.org/library/drmath/view/51879.html for derivation
      const R = radius;
      const φ1 = toRadians(start[1]), λ1 = toRadians(start[0]);
      const φ2 = toRadians(destination[1]), λ2 = toRadians(destination[0]);
      const Δφ = φ2 - φ1;
      const Δλ = λ2 - λ1;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      return d;
  }
  /**
   * Returns the initial bearing from start point to destination point.
   *
   * @param   {GeoJSON.Position} start - Longitude/latitude of start point.
   * @param   {GeoJSON.Position} destination - Longitude/latitude of destination point.
   * @returns {number} Initial bearing in degrees from north (0°..360°).
   *
   * @example
   *   const p1 = [0.119, 52.205];
   *   const p2 = [2.351, 48.857];
   *   const b1 = initialBearing(p1, p2); // 156.2°
   */
  function initialBearing(start, destination) {
      if (equals(start, destination))
          return NaN; // coincident points
      // tanθ = sinΔλ⋅cosφ2 / cosφ1⋅sinφ2 − sinφ1⋅cosφ2⋅cosΔλ
      // see mathforum.org/library/drmath/view/55417.html for derivation
      const φ1 = toRadians(start[1]);
      const φ2 = toRadians(destination[1]);
      const Δλ = toRadians(destination[0] - start[0]);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const θ = Math.atan2(y, x);
      const bearing = toDegrees(θ);
      return wrap360(bearing);
  }
  /**
   * Returns final bearing arriving at destination point from ‘this’ point; the final bearing will
   * differ from the initial bearing by varying degrees according to distance and latitude.
   *
   * @param   {GeoJSON.Position} start - Longitude/latitude of start point.
   * @param   {GeoJSON.Position} destination - Longitude/latitude of destination point.
   * @returns {number} Final bearing in degrees from north (0°..360°).
   *
   * @example
   *   const p1 = [0.119, 52.205];
   *   const p2 = [2.351, 48.857];
   *   const b2 = finalBearing(p1, p2); // 157.9°
   */
  function finalBearing(start, destination) {
      // get initial bearing from destination point to this point & reverse it by adding 180°
      const bearing = initialBearing(destination, start) + 180;
      return wrap360(bearing);
  }
  /**
   * Returns the midpoint between start point and destination point.
   *
   * @param   {GeoJSON.Position} start - Longitude/latitude of start point.
   * @param   {GeoJSON.Position} destination - Longitude/latitude of destination point.
   * @returns {GeoJSON.Position} Midpoint between this point and destination point.
   *
   * @example
   *   const p1 = [0.119, 52.205];
   *   const p2 = [2.351, 48.857];
   *   const pMid = midpoint(p1, p2); // [1.2746, 50.5363]
   */
  function midpoint(start, destination) {
      // φm = atan2( sinφ1 + sinφ2, √( (cosφ1 + cosφ2⋅cosΔλ)² + cos²φ2⋅sin²Δλ ) )
      // λm = λ1 + atan2(cosφ2⋅sinΔλ, cosφ1 + cosφ2⋅cosΔλ)
      // midpoint is sum of vectors to two points: mathforum.org/library/drmath/view/51822.html
      const φ1 = toRadians(start[1]);
      const λ1 = toRadians(start[0]);
      const φ2 = toRadians(destination[1]);
      const Δλ = toRadians(destination[0] - start[0]);
      // get cartesian coordinates for the two points
      const A = { x: Math.cos(φ1), y: 0, z: Math.sin(φ1) }; // place point A on prime meridian y=0
      const B = { x: Math.cos(φ2) * Math.cos(Δλ), y: Math.cos(φ2) * Math.sin(Δλ), z: Math.sin(φ2) };
      // vector to midpoint is sum of vectors to two points (no need to normalise)
      const C = { x: A.x + B.x, y: A.y + B.y, z: A.z + B.z };
      const φm = Math.atan2(C.z, Math.sqrt(C.x * C.x + C.y * C.y));
      const λm = λ1 + Math.atan2(C.y, C.x);
      const lat = toDegrees(φm);
      const lon = toDegrees(λm);
      return [lon, lat];
  }
  /**
   * Returns the destination point from start point having travelled the given distance on the
   * given initial bearing (bearing normally varies around path followed).
   *
   * @param   {GeoJSON.Position} start - Longitude/latitude of start point.
   * @param   {number} distance - Distance travelled, in same units as earth radius (default: metres).
   * @param   {number} bearing - Initial bearing in degrees from north.
   * @param   {number} [radius] - Radius of earth (defaults to mean radius in metres).
   * @returns {GeoJSON.Position} Destination point.
   *
   * @example
   *   const p1 = [-0.00147, 51.47788];
   *   const p2 = destinationPoint(p1, 7794, 300.7); // [0.0983, 51.5136]
   */
  function destinationPoint(start, distance, bearing, radius = DEFAULT_RADIUS) {
      // sinφ2 = sinφ1⋅cosδ + cosφ1⋅sinδ⋅cosθ
      // tanΔλ = sinθ⋅sinδ⋅cosφ1 / cosδ−sinφ1⋅sinφ2
      // see mathforum.org/library/drmath/view/52049.html for derivation
      const δ = distance / radius; // angular distance in radians
      const θ = toRadians(bearing);
      const φ1 = toRadians(start[1]), λ1 = toRadians(start[0]);
      const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
      const φ2 = Math.asin(sinφ2);
      const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
      const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
      const λ2 = λ1 + Math.atan2(y, x);
      const lat = toDegrees(φ2);
      const lon = toDegrees(λ2);
      return [lon, lat];
  }

  exports.destinationPoint = destinationPoint;
  exports.distance = distance;
  exports.finalBearing = finalBearing;
  exports.initialBearing = initialBearing;
  exports.midpoint = midpoint;

}));
//# sourceMappingURL=geodesy-fn.umd.js.map

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
declare function distance(start: GeoJSON.Position, destination: GeoJSON.Position, radius?: number): number;
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
declare function initialBearing(start: GeoJSON.Position, destination: GeoJSON.Position): number;
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
declare function finalBearing(start: GeoJSON.Position, destination: GeoJSON.Position): number;
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
declare function midpoint(start: GeoJSON.Position, destination: GeoJSON.Position): GeoJSON.Position;
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
declare function destinationPoint(start: GeoJSON.Position, distance: number, bearing: number, radius?: number): GeoJSON.Position;

export { destinationPoint, distance, finalBearing, initialBearing, midpoint };

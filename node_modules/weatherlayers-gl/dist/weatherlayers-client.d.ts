import { Palette } from 'cpt2js';
export { Palette, Scale, colorRampCanvas, parsePalette } from 'cpt2js';

declare const VERSION: string;
declare const DATETIME: string;

declare function setLibrary(name: string, library: unknown): void;

type TextureDataArray = Uint8Array | Uint8ClampedArray | Float32Array;
interface TextureData {
    data: TextureDataArray;
    width: number;
    height: number;
}
type FloatDataArray = Float32Array;
interface FloatData {
    data: FloatDataArray;
    width: number;
    height: number;
}
interface LoadOptions {
    headers?: Record<string, string>;
    signal?: AbortSignal;
}
interface CachedLoadOptions<T> extends LoadOptions {
    cache?: Map<string, T | Promise<T>> | false;
}
type LoadFunction<T> = (url: string, options?: LoadOptions) => Promise<T>;
type CachedLoadFunction<T> = (url: string, options?: CachedLoadOptions<T>) => Promise<T>;
declare const loadTextureData: CachedLoadFunction<TextureData>;
declare const loadJson: CachedLoadFunction<any>;

type DatetimeISOString = string;
type DatetimeISOStringRange = [start: DatetimeISOString, end: DatetimeISOString];
type OpenDatetimeISOStringRange = [start: DatetimeISOString | null, end: DatetimeISOString | null];
type DatetimeFormatFunction = (value: DatetimeISOString) => DatetimeISOString;
type DurationISOString = string;
declare function interpolateDatetime(start: DatetimeISOString, end: DatetimeISOString | null, weight: number): string;
declare function getDatetimeWeight(start: DatetimeISOString, end: DatetimeISOString | null, middle: DatetimeISOString): number;
declare function getClosestStartDatetime(datetimes: DatetimeISOString[], datetime: DatetimeISOString): DatetimeISOString | undefined;
declare function getClosestEndDatetime(datetimes: DatetimeISOString[], datetime: DatetimeISOString): DatetimeISOString | undefined;
declare function offsetDatetime(datetime: DatetimeISOString, hour: number): DatetimeISOString;
declare function offsetDatetimeRange(datetime: DatetimeISOString, startHour: number, endHour: number): DatetimeISOStringRange;
declare function formatDatetime(value: DatetimeISOString): string;

declare const ImageType: {
    readonly SCALAR: "SCALAR";
    readonly VECTOR: "VECTOR";
};
type ImageType = (typeof ImageType)[keyof typeof ImageType];

type ImageUnscale = [min: number, max: number] | null;

declare const UnitSystem: {
    readonly METRIC: "METRIC";
    readonly METRIC_KILOMETERS: "METRIC_KILOMETERS";
    readonly IMPERIAL: "IMPERIAL";
    readonly NAUTICAL: "NAUTICAL";
};
type UnitSystem = (typeof UnitSystem)[keyof typeof UnitSystem];

interface UnitFormat {
    unit: string;
    scale?: number;
    offset?: number;
    decimals?: number;
}

interface ClientConfig {
    url?: string;
    accessToken?: string;
    dataFormat?: string;
    unitSystem?: UnitSystem;
    attributionLinkClass?: string;
    datetimeStep?: number;
    datetimeInterpolate?: boolean;
}
interface LoadConfig extends ClientConfig {
    signal?: AbortSignal;
}
interface Dataset {
    title: string;
    unitFormat: UnitFormat;
    attribution: string;
    bounds: [number, number, number, number];
    datetimeRange: OpenDatetimeISOStringRange;
    datetimes: DatetimeISOString[];
    palette: Palette;
}
interface DatasetSlice {
    datetimes: DatetimeISOString[];
}
interface DatasetData {
    datetime: DatetimeISOString;
    referenceDatetime: DatetimeISOString;
    horizon: DurationISOString;
    image: TextureData;
    datetime2: DatetimeISOString | null;
    referenceDatetime2: DatetimeISOString | null;
    horizon2: DurationISOString | null;
    image2: TextureData | null;
    imageWeight: number;
    imageType: ImageType;
    imageUnscale: ImageUnscale;
    bounds: [number, number, number, number];
}
declare class Client {
    private _config;
    private _cache;
    private _datasetStacCollectionCache;
    private _datasetDataStacItemCache;
    constructor(config: ClientConfig);
    getConfig(): ClientConfig;
    setConfig(config: ClientConfig): void;
    updateConfig(config: Partial<ClientConfig>): void;
    private _getAuthenticatedUrl;
    private _cacheDatasetStacCollection;
    private _cacheDatasetDataStacItem;
    private _loadStacCatalog;
    private _loadDatasetStacCollections;
    private _loadDatasetStacCollection;
    private _loadDatasetStacCollectionPalette;
    private _searchDatasetDataStacItems;
    private _loadDatasetDataStacItem;
    private _loadStacItemData;
    private _loadDatasetDataStacItemDataNow;
    private _loadDatasetDataStacItemData;
    loadCatalog(config?: ClientConfig): Promise<string[]>;
    loadDataset(dataset: string, config?: ClientConfig): Promise<Dataset>;
    loadDatasetSlice(dataset: string, datetimeRange: DatetimeISOStringRange, config?: ClientConfig): Promise<DatasetSlice>;
    loadDatasetData(dataset: string, datetime?: DatetimeISOString, config?: LoadConfig): Promise<DatasetData>;
}

export { Client, DATETIME, ImageType, UnitSystem, VERSION, formatDatetime, getClosestEndDatetime, getClosestStartDatetime, getDatetimeWeight, interpolateDatetime, loadJson, loadTextureData, offsetDatetime, offsetDatetimeRange, setLibrary };
export type { CachedLoadFunction, CachedLoadOptions, ClientConfig, Dataset, DatasetData, DatasetSlice, DatetimeFormatFunction, DatetimeISOString, DatetimeISOStringRange, DurationISOString, FloatData, FloatDataArray, ImageUnscale, LoadConfig, LoadFunction, LoadOptions, OpenDatetimeISOStringRange, TextureData, TextureDataArray, UnitFormat };

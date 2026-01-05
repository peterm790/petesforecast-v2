// Native-synced range storage (per variable, in native units)
// Local implementation using localStorage. Values are numbers.
// Schema:
// {
//   "<variable>": { "min": <number>, "max": <number> },
//   ...
// }

const STORAGE_KEY = 'pf_range_overrides_native_v1';

function readAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const obj = JSON.parse(raw);
        return (obj && typeof obj === 'object') ? obj : {};
    } catch {
        return {};
    }
}

function writeAll(obj) {
    const safe = (obj && typeof obj === 'object') ? obj : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export function getNativeRange(variable) {
    if (!variable) return null;
    const all = readAll();
    const rec = all[variable];
    if (!rec) return null;
    if (!Number.isFinite(rec.min) || !Number.isFinite(rec.max)) return null;
    return { min: Number(rec.min), max: Number(rec.max) };
}

export function setNativeRange(variable, min, max) {
    if (!variable) throw new Error('variable required');
    if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error('min/max must be finite');
    const all = readAll();
    all[variable] = { min: Number(min), max: Number(max) };
    writeAll(all);
}



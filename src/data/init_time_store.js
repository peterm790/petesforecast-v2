import { fetchInitTimeRange, generateInitTimes6h, parseInitTimeToDate } from '../util.js';

let initRangePromise = null;
let initRangeResult = null;

let initDatesAscPromise = null;
let initDatesAscResult = null;

async function loadInitTimeRange() {
    if (initRangeResult) return initRangeResult;
    if (!initRangePromise) {
        initRangePromise = fetchInitTimeRange()
            .then((range) => {
                initRangeResult = range;
                return range;
            })
            .catch((err) => {
                initRangePromise = null;
                throw err;
            });
    }
    return initRangePromise;
}

export async function getInitTimeRange() {
    return loadInitTimeRange();
}

export async function getInitDatesAsc() {
    if (initDatesAscResult) return initDatesAscResult;
    if (!initDatesAscPromise) {
        initDatesAscPromise = (async () => {
            const [first, latest] = await loadInitTimeRange();
            const dates = generateInitTimes6h(first, latest);
            initDatesAscResult = dates;
            return dates;
        })().catch((err) => {
            initDatesAscPromise = null;
            throw err;
        });
    }
    return initDatesAscPromise;
}

export async function getLatestIso() {
    const [, latest] = await loadInitTimeRange();
    return parseInitTimeToDate(latest).toISOString().replace('.000Z', 'Z');
}

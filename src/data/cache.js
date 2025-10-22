// Simple in-memory forecast cache with concurrency and abort control

export class DataCache {
    constructor(options = {}) {
        this.maxConcurrency = options.maxConcurrency || 8;
        this.cache = new Map(); // key: `${initKey}|${variable}|${lead}` -> rasterData
    }

    abortAll() { /* no-op: preloads no longer share a global controller */ }

    clear() {
        this.cache.clear();
    }

    get(variable, lead, initKey) {
        return this.cache.get(`${initKey}|${variable}|${lead}`);
    }

    async preload({ variables, initKey, leads, buildUrl, fetchData, onProgress }) {
        if (!Array.isArray(variables) || variables.length === 0 || !Array.isArray(leads) || leads.length === 0) {
            throw new Error('preload: invalid arguments');
        }
        // local (unused) signal placeholder; we don't cancel across preloads
        const signal = undefined;
        
        // Build tasks only for missing items
        const tasks = [];
        for (const variable of variables) {
            for (const lead of leads) {
                const key = `${initKey}|${variable}|${lead}`;
                if (!this.cache.has(key)) {
                    tasks.push({ variable, lead, url: buildUrl(variable, lead), key });
                }
            }
        }

        const total = tasks.length;
        let done = 0;
        const tick = () => { done++; if (onProgress) onProgress(done, total); };

        // Concurrent fetching with bounded workers; log errors and continue
        const queue = tasks.slice();
        const workers = Array.from({ length: Math.min(this.maxConcurrency, queue.length) }, () => this._worker({ queue, signal, fetchData, tick }));
        await Promise.all(workers);
    }

    async _worker({ queue, signal, fetchData, tick }) {
        while (true) {
            let task;
            // simple critical section
            if (queue.length === 0) return;
            task = queue.shift();
            try {
                const data = await fetchData(task.url, signal);
                this.cache.set(task.key, data);
            } catch (err) {
                if (signal && signal.aborted) return;
                console.error(`Failed to cache ${task.variable} lead=${task.lead}:`, err);
                // continue
            } finally {
                tick();
            }
        }
    }
}



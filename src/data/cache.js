// Simple in-memory forecast cache with concurrency and abort control

export class DataCache {
    constructor(options = {}) {
        this.maxConcurrency = options.maxConcurrency || 2;
        this.batchSize = options.batchSize || 2;
        this.interBatchDelayMs = typeof options.interBatchDelayMs === 'number' ? options.interBatchDelayMs : 150;
        this.cache = new Map(); // key: `${initKey}|${variable}|${lead}` -> rasterData
    }

    abortAll() { /* no-op: preloads no longer share a global controller */ }

    clear() {
        this.cache.clear();
    }

    get(variable, lead, initKey) {
        return this.cache.get(`${initKey}|${variable}|${lead}`);
    }

    async preload({ variables, initKey, leads, buildUrl, fetchData, onProgress, chunkSize = 12 }) {
        if (!Array.isArray(variables) || variables.length === 0 || !Array.isArray(leads) || leads.length === 0) {
            throw new Error('preload: invalid arguments');
        }
        // local (unused) signal placeholder; we don't cancel across preloads
        const signal = undefined;
        
        // Build chunked tasks only for missing items
        const tasks = [];
        let total = 0; // total frames to fetch
        for (const variable of variables) {
            const missingLeads = [];
            for (const lead of leads) {
                const key = `${initKey}|${variable}|${lead}`;
                if (!this.cache.has(key)) {
                    missingLeads.push(lead);
                }
            }
            total += missingLeads.length;
            for (let i = 0; i < missingLeads.length; i += chunkSize) {
                const leadsChunk = missingLeads.slice(i, i + chunkSize);
                if (leadsChunk.length === 0) continue;
                const url = buildUrl(variable, leadsChunk);
                if (typeof window !== 'undefined' && window.DEBUG_ORDER) {
                    try { console.log('[ORDER][TASK]', { variable, initKey, leadsChunk: leadsChunk.slice() }); } catch {}
                }
                tasks.push({ variable, leads: leadsChunk, url, initKey });
            }
        }

        let done = 0;
        const tick = () => { done++; if (onProgress) onProgress(done, total); };

        // Process in batches to avoid background throttling
        const failedChunks = [];
        const runBatches = async (queue) => {
            while (queue.length > 0) {
                const batch = queue.splice(0, this.batchSize);
                const workers = Array.from({ length: Math.min(this.maxConcurrency, batch.length) }, (_, i) =>
                    this._worker({ queue: batch, signal, fetchData, tick, onChunkFailed: (task, err) => { failedChunks.push(task); } })
                );
                await Promise.all(workers);
                if (queue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.interBatchDelayMs));
                }
            }
        };

        const queue = tasks.slice();
        await runBatches(queue);

        // Single retry pass for failed chunks
        if (failedChunks.length > 0) {
            const retryQueue = failedChunks.slice();
            // brief backoff before retry
            await new Promise(resolve => setTimeout(resolve, Math.max(150, this.interBatchDelayMs)));
            // Clear collector for potential subsequent failures (not retried again)
            failedChunks.length = 0;
            await runBatches(retryQueue);
        }
    }

    async _worker({ queue, signal, fetchData, tick, onChunkFailed }) {
        while (true) {
            let task;
            // simple critical section
            if (queue.length === 0) return;
            task = queue.shift();
            try {
                const frames = await fetchData(task.url, signal);
                if (typeof window !== 'undefined' && window.DEBUG_ORDER) {
                    try { console.log('[ORDER][STORE_BEGIN]', { variable: task.variable, initKey: task.initKey, leads: task.leads.slice(), frames: frames.length }); } catch {}
                }
                const count = Math.min(frames.length, task.leads.length);
                for (let i = 0; i < count; i++) {
                    const lead = task.leads[i];
                    const key = `${task.initKey}|${task.variable}|${lead}`;
                    this.cache.set(key, frames[i]);
                    if (typeof window !== 'undefined' && window.DEBUG_ORDER) {
                        try { console.log('[ORDER][MAP]', { mapIndex: i, lead, key }); } catch {}
                    }
                    tick();
                }
                if (typeof window !== 'undefined' && window.DEBUG_ORDER) {
                    try { console.log('[ORDER][STORE_END]', { variable: task.variable, initKey: task.initKey, stored: count, leads: task.leads.slice() }); } catch {}
                }
            } catch (err) {
                if (signal && signal.aborted) return;
                console.error(`Failed to cache ${task.variable} leads=${Array.isArray(task.leads) ? task.leads.join(',') : task.leads}:`, err);
                if (onChunkFailed) onChunkFailed(task, err);
                // continue
            } finally {
                // progress ticked per stored frame
            }
        }
    }
}



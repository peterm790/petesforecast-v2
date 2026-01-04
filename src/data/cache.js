// Simple in-memory forecast cache with concurrency and abort control

export class DataCache {
    constructor(options = {}) {
        this.maxConcurrency = options.maxConcurrency || 2;
        this.batchSize = options.batchSize || 2;
        this.interBatchDelayMs = typeof options.interBatchDelayMs === 'number' ? options.interBatchDelayMs : 150;
        this.cache = new Map(); // key: `${initKey}|${variable}|${lead}` -> rasterData
		this._tokenControllers = new Map(); // token -> AbortController
    }

	abortAll() {
		// Abort all active token controllers
		for (const [, controller] of this._tokenControllers) {
			try { controller.abort(); } catch {}
		}
		this._tokenControllers.clear();
	}

	abortToken(token) {
		if (!token && token !== 0) return;
		const controller = this._tokenControllers.get(token);
		if (controller) {
			try { controller.abort(); } catch {}
			this._tokenControllers.delete(token);
		}
	}

    clear() {
        this.cache.clear();
    }

    get(variable, lead, initKey) {
        return this.cache.get(`${initKey}|${variable}|${lead}`);
    }

	async preload({ variables, initKey, leads, buildUrl, fetchData, onProgress, chunkSize = 12, token = undefined }) {
        if (!Array.isArray(variables) || variables.length === 0 || !Array.isArray(leads) || leads.length === 0) {
            throw new Error('preload: invalid arguments');
        }
		// Per-preload controller for cancellation
		let controller = undefined;
		let signal = undefined;
		if (token || token === 0) {
			controller = new AbortController();
			signal = controller.signal;
			// If an older controller exists for this token, abort and replace
			const old = this._tokenControllers.get(token);
			if (old) {
				try { old.abort(); } catch {}
			}
			this._tokenControllers.set(token, controller);
		}
        
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
		try {
			await runBatches(queue);
		} finally {
			// Clean up controller for this token
			if (token || token === 0) {
				// Only delete if the same controller is still stored
				const c = this._tokenControllers.get(token);
				if (c === controller) {
					this._tokenControllers.delete(token);
				}
			}
		}

        // Single retry pass for failed chunks
		if (failedChunks.length > 0 && (!signal || !signal.aborted)) {
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
                const count = Math.min(frames.length, task.leads.length);
                for (let i = 0; i < count; i++) {
                    const lead = task.leads[i];
                    const key = `${task.initKey}|${task.variable}|${lead}`;
                    this.cache.set(key, frames[i]);
                    tick();
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



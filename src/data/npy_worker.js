import NPY from 'npyjs';

const npy = new NPY();

function serializeError(err) {
    if (!err) return { message: 'Unknown error' };
    return {
        message: err.message || String(err),
        name: err.name || 'Error',
        stack: err.stack || ''
    };
}

self.onmessage = async (event) => {
    const { id, buffer } = event.data || {};
    if (!id || !buffer) {
        self.postMessage({ id, error: { message: 'Invalid worker request' } });
        return;
    }
    try {
        const { data, shape } = await npy.load(buffer);
        // Transfer the underlying buffer for performance.
        self.postMessage({ id, data, shape }, [data.buffer]);
    } catch (err) {
        self.postMessage({ id, error: serializeError(err) });
    }
};

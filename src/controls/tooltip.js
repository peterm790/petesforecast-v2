// Tooltip manager with lazy import of weatherlayers-gl

export function createTooltipManager({ getDeckOverlay }) {
    let control = null;

    async function ensureControl() {
        if (control) return control;
        const mod = await import('weatherlayers-gl');
        const TooltipControl = mod.TooltipControl;
        const DirectionFormat = mod.DirectionFormat;
        const Placement = mod.Placement;
        const overlay = typeof getDeckOverlay === 'function' ? getDeckOverlay() : getDeckOverlay;
        const deck = overlay && overlay._deck;
        if (deck && deck.getCanvas && deck.getCanvas()) {
            control = new TooltipControl({
                unitFormat: { unit: '' },
                directionFormat: DirectionFormat.VALUE,
                followCursor: true,
                followCursorOffset: 12,
                followCursorPlacement: Placement.TOP
            });
            control.addTo(deck.getCanvas().parentElement);
        }
        return control;
    }

    async function updateUnit(unit) {
        const ctrl = await ensureControl();
        if (!ctrl) return;
        const cfg = ctrl.getConfig ? ctrl.getConfig() : {};
        ctrl.setConfig({ ...cfg, unitFormat: { unit } });
    }

    async function updateAtPixel(x, y, rasterValue, direction) {
        const ctrl = await ensureControl();
        if (!ctrl) return;
        const payload = { x, y, raster: { value: rasterValue, ...(typeof direction === 'number' ? { direction } : {}) } };
        ctrl.updatePickingInfo(payload);
    }

    function clear() {
        if (control && control.update) control.update(undefined);
    }

    return { updateUnit, updateAtPixel, clear };
}



// Custom tooltip manager replacing weatherlayers-gl control

export function createTooltipManager() {
    let tooltipElement = null;
    let currentUnit = '';

    function ensureTooltip() {
        if (tooltipElement) return tooltipElement;
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'pf-tooltip';
        document.body.appendChild(tooltipElement);
        return tooltipElement;
    }

    function updateUnit(unit) {
        currentUnit = unit || '';
    }

    function updateAtPixel(x, y, value, direction, extraLabel) {
        const el = ensureTooltip();
        
        // Hide if no valid data
        if (value === null || value === undefined || isNaN(value)) {
            el.style.display = 'none';
            return;
        }

        el.style.display = 'block';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        
        // Format value (assuming float, keep 1 decimal mostly)
        const valStr = typeof value === 'number' ? value.toFixed(1) : value;
        
        // Main row: Value + Unit + (optional) Direction
        let content = `<div class="pf-tooltip-value">
            ${valStr}<span class="pf-tooltip-unit">${currentUnit}</span>`;
        
        if (typeof direction === 'number') {
             // Append direction in same row with '@' separator
             // Opacity 0.85 requested
             content += `<span class="pf-tooltip-row" style="margin-left: 6px; margin-top: 0; opacity: 0.85;">@ ${Math.round(direction)}°</span>`;
        }
        
        content += `</div>`; // Close main row
        
        if (extraLabel) {
            // Ensure coordinates are nicely formatted (lines separated by space in input, we can break them)
            // Input format: "12° 34.5' N 12° 34.5' E" (example)
            // We can just display it. Use <br> if we want strict lines.
            // extraLabel comes from src/index.js as formatted string.
            content += `<div class="pf-tooltip-coords">${extraLabel}</div>`;
        }
        
        el.innerHTML = content;
    }

    function clear() {
        if (tooltipElement) tooltipElement.style.display = 'none';
    }

    return { updateUnit, updateAtPixel, clear };
}

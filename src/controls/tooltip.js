// Custom tooltip manager replacing weatherlayers-gl control

export function createTooltipManager({ onClose } = {}) {
    let tooltipElement = null;
    let contentElement = null;
    let currentUnit = '';
    let currentPrecision = 2;

    function ensureTooltip() {
        if (tooltipElement) return tooltipElement;
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'pf-tooltip';
        
        // Close button
        const closeBtn = document.createElement('div');
        closeBtn.className = 'pf-tooltip-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            if (onClose) onClose();
            else if (tooltipElement) tooltipElement.style.display = 'none';
        };
        tooltipElement.appendChild(closeBtn);

        // Content container
        contentElement = document.createElement('div');
        tooltipElement.appendChild(contentElement);

        document.body.appendChild(tooltipElement);
        return tooltipElement;
    }

    function updateUnit(unitOrConfig) {
        if (unitOrConfig && typeof unitOrConfig === 'object') {
            currentUnit = unitOrConfig.unit || '';
            if (Number.isFinite(unitOrConfig.precision)) {
                currentPrecision = Math.max(0, Math.floor(unitOrConfig.precision));
            }
        } else {
            currentUnit = unitOrConfig || '';
        }
    }

    function updateAtPixel(x, y, value, direction, extraLabel) {
        ensureTooltip();
        const el = tooltipElement;
        
        // Hide if no valid data
        if (value === null || value === undefined || isNaN(value)) {
            el.style.display = 'none';
            return;
        }

        el.style.display = 'block';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        
        // Format value using configured precision
        const valStr = (typeof value === 'number' && Number.isFinite(value))
            ? String(Number(value.toFixed(Math.max(0, currentPrecision))))
            : value;
        
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
        
        if (contentElement) contentElement.innerHTML = content;
    }

    function clear() {
        if (tooltipElement) tooltipElement.style.display = 'none';
    }

    return { updateUnit, updateAtPixel, clear };
}

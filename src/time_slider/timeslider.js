// Plain JS time slider component. DOM-based, similar to MenuBar.
// Exposes selected lead time (in hours) via onChange callback.

import { parseInitTimeToDate } from '../util.js';

function hoursForFrequency(freq) {
    if (freq === '3d') return Array.from({ length: 73 }, (_, i) => i);
    if (freq === '5d') return Array.from({ length: 121 }, (_, i) => i);
    if (freq === '16d-3h') return Array.from({ length: 129 }, (_, i) => i * 3);
    throw new Error(`Unknown frequency: ${freq}`);
}

function formatLocal(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const offsetMin = -date.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const offH = Math.floor(abs / 60);
    const offM = abs % 60;
    const tz = offM ? `GMT${sign}${offH}:${String(offM).padStart(2, '0')}` : `GMT${sign}${offH}`;
    return `${dayName} (${dd}/${mm}) ${hh}:${mi} ${tz}`;
}

export class TimeSlider {
    constructor(options = {}) {
        const { mount = null, onChange = null } = options;
        this.mountTarget = mount;
        this.onChange = typeof onChange === 'function' ? onChange : null;

        this.root = null;
        this.label = null;
        this.slider = null;
        this.minLabel = null;
        this.maxLabel = null;

        // Derived state
        this.currentFrequency = '3d';
        this.availableHours = hoursForFrequency('3d');
        this.currentIndex = 0;
        this.initTime = null; // Date in UTC
    }

    mount(target) {
        const host = target || this.mountTarget || document.body;
        if (!host) throw new Error('TimeSlider: no mount target provided');
        if (this.root) return;

        const root = document.createElement('div');
        root.className = 'pf-timeslider-container';

        const wrap = document.createElement('div');
        wrap.className = 'pf-timeslider-wrap';

        const label = document.createElement('div');
        label.className = 'pf-timeslider-label';
        label.textContent = '';

        const row = document.createElement('div');
        row.className = 'pf-timeslider-row';

        const minLabel = document.createElement('div');
        minLabel.className = 'pf-timeslider-edge pf-timeslider-min';
        const maxLabel = document.createElement('div');
        maxLabel.className = 'pf-timeslider-edge pf-timeslider-max';

        const input = document.createElement('input');
        input.type = 'range';
        input.className = 'pf-timeslider-input';
        input.min = '0';
        input.max = String(Math.max(0, this.availableHours.length - 1));
        input.step = '1';
        input.value = String(this.currentIndex);
        input.disabled = true; // until init time known

        input.addEventListener('input', () => {
            this.currentIndex = Number(input.value);
            this._updateLabel();
            this._emitHours();
        });

        row.appendChild(minLabel);
        row.appendChild(input);
        row.appendChild(maxLabel);

        wrap.appendChild(label);
        wrap.appendChild(row);
        root.appendChild(wrap);
        host.appendChild(root);

        this.root = root;
        this.label = label;
        this.slider = input;
        this.minLabel = minLabel;
        this.maxLabel = maxLabel;

        this._refreshBounds();
        this._updateLabel();
    }

    unmount() {
        if (!this.root) return;
        this.root.remove();
        this.root = null;
        this.label = null;
        this.slider = null;
        this.minLabel = null;
        this.maxLabel = null;
    }

    destroy() { this.unmount(); }

    setFromMenuState(state) {
        // Frequency → hours array
        const newHours = hoursForFrequency(state.frequency);
        const freqChanged = state.frequency !== this.currentFrequency;
        this.currentFrequency = state.frequency;
        this.availableHours = newHours;

        // Init time may be ISO string like 2025-01-01T00:00:00.000000000; parse to Date (UTC)
        let parsedInit = null;
        if (state.initData && typeof state.initData === 'string' && state.initData !== '00Z') {
            try {
                // Accept either the raw dataset string or an ISO Z; strip trailing 'Z' if present for parser
                const cleaned = state.initData.endsWith('Z') ? state.initData.slice(0, -1) : state.initData;
                parsedInit = parseInitTimeToDate(cleaned);
            } catch (e) {
                // Respect rule: raise errors, no silent fallbacks
                throw e;
            }
        }
        this.initTime = parsedInit;

        // Ensure slider range
        this._refreshBounds();

        // Enable only if we have a valid init time
        if (this.slider) this.slider.disabled = !this.initTime;

        // Keep index in range
        if (this.currentIndex > this.availableHours.length - 1) {
            this.currentIndex = this.availableHours.length - 1;
            if (this.slider) this.slider.value = String(this.currentIndex);
        }

        // Update label
        this._updateLabel();
    }

    _refreshBounds() {
        if (!this.slider) return;
        const maxIndex = Math.max(0, this.availableHours.length - 1);
        this.slider.max = String(maxIndex);
        this.slider.min = '0';
        this.slider.step = '1';
        this.minLabel.textContent = 'Hour 0';
        this.maxLabel.textContent = `Hour ${this.availableHours[maxIndex]}`;
    }

    _emitHours() {
        if (!this.onChange) return;
        const leadHours = this.availableHours[this.currentIndex] || 0;
        this.onChange(leadHours);
    }

    _updateLabel() {
        if (!this.label) return;
        const leadHours = this.availableHours[this.currentIndex] || 0;
        if (!this.initTime) {
            this.label.textContent = `Lead ${leadHours}h`;
            return;
        }
        const ts = new Date(this.initTime.getTime() + leadHours * 60 * 60 * 1000);
        this.label.textContent = `${formatLocal(ts)} (Lead ${leadHours}h)`;
    }
}



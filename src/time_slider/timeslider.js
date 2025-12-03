// Plain JS time slider component. DOM-based, similar to MenuBar.
// Exposes selected lead time (in hours) via onChange callback.

import { parseInitTimeToDate, formatLocal, formatUTC } from '../util.js';

function hoursForFrequency(freq) {
    if (freq === '24h') return Array.from({ length: 24 }, (_, i) => i + 1);
    if (freq === '3d') return Array.from({ length: 72 }, (_, i) => i + 1);
    if (freq === '5d') return Array.from({ length: 120 }, (_, i) => i + 1);
    if (freq === '16d-3h') return Array.from({ length: 127 }, (_, i) => (i + 1) * 3); // 3..381
    throw new Error(`Unknown frequency: ${freq}`);
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
        this.showLocalTime = false;
        this._lastActive = null;
        this.bgLoading = { active: false, done: 0, total: 0 };
        this.maxPlayableIndex = Infinity;
        this.useLocalTime = false;
    }

    setAvailableRange(maxIndex) {
        this.maxPlayableIndex = typeof maxIndex === 'number' ? maxIndex : Infinity;
        
        // If current index is beyond available range, clamp it
        if (this.currentIndex > this.maxPlayableIndex) {
            this._setIndex(this.maxPlayableIndex);
        }
        
        this._updateTrackProgress();
    }

    setBackgroundLoading(active, done = 0, total = 0) {
        this.bgLoading = { active, done, total };
        this._updateLabel();
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
        input.disabled = true; // Disabled until init time is known

        input.addEventListener('input', () => {
            const val = Number(input.value);
            // Apply constraint immediately during drag
            if (this.maxPlayableIndex !== Infinity && val > this.maxPlayableIndex) {
                input.value = String(this.maxPlayableIndex);
                this.currentIndex = this.maxPlayableIndex;
            } else {
                this.currentIndex = val;
            }
            
            this._updateLabel();
            this._emitHours();
            this._markLastActive('slider');
        });

        // Tap/click track to jump to nearest step
        const setIndexFromClientX = (clientX) => {
            const rect = this.slider.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
            const maxIndex = Math.max(0, this.availableHours.length - 1);
            const idx = Math.round(ratio * maxIndex);
            this._setIndex(idx);
        };

        input.addEventListener('pointerdown', (e) => {
            if (this.slider.disabled) return;
            if (typeof e.clientX === 'number') setIndexFromClientX(e.clientX);
            this._markLastActive('slider');
        });

        input.addEventListener('click', (e) => {
            if (this.slider.disabled) return;
            if (typeof e.clientX === 'number') setIndexFromClientX(e.clientX);
            this._markLastActive('slider');
        });

        // Step buttons
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pf-timeslider-step pf-prev';
        prevBtn.type = 'button';
        prevBtn.setAttribute('aria-label', 'Previous time step');
        prevBtn.textContent = '<';
        prevBtn.addEventListener('click', () => {
            if (this.slider?.disabled) return;
            this.stepBy(-1);
            this._markLastActive('slider');
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pf-timeslider-step pf-next';
        nextBtn.type = 'button';
        nextBtn.setAttribute('aria-label', 'Next time step');
        nextBtn.textContent = '>';
        nextBtn.addEventListener('click', () => {
            if (this.slider?.disabled) return;
            this.stepBy(+1);
            this._markLastActive('slider');
        });

        // Row order: min | prev | slider | next | max
        row.appendChild(minLabel);
        row.appendChild(prevBtn);
        row.appendChild(input);
        row.appendChild(nextBtn);
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
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;

        // Global keyboard handling: ArrowLeft/ArrowRight when slider was last active
        const onKeyDown = (e) => {
            if (this.slider?.disabled) return;
            const ae = document.activeElement;
            const typing = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
            if (typing) return;
            if (this._lastActive !== 'slider') return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.stepBy(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.stepBy(+1); }
        };
        window.addEventListener('keydown', onKeyDown);
        this._offKeyDown = () => window.removeEventListener('keydown', onKeyDown);

        // Detect map interactions to suppress global keys when map is last selected
        const mapEl = document.getElementById('map');
        if (mapEl) {
            const onMapPointer = () => this._markLastActive('map');
            mapEl.addEventListener('pointerdown', onMapPointer);
            this._offMapPointer = () => mapEl.removeEventListener('pointerdown', onMapPointer);
        }

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
        this.prevBtn = null;
        this.nextBtn = null;
        if (this._offKeyDown) this._offKeyDown();
        if (this._offMapPointer) this._offMapPointer();
    }

    destroy() { this.unmount(); }

    setFromMenuState(state) {
        // Frequency → hours array
        const newHours = hoursForFrequency(state.frequency);
        const freqChanged = state.frequency !== this.currentFrequency;
        this.currentFrequency = state.frequency;
        this.availableHours = newHours;
        this.showLocalTime = !!state.showLocalTime;
        
        // Resets playable range until updated
        this.maxPlayableIndex = Infinity;
        
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
        this.minLabel.textContent = `Hour ${this.availableHours[0] || 1}`;
        this.maxLabel.textContent = `Hour ${this.availableHours[maxIndex]}`;
        this._updateTrackProgress();
    }
    
    _updateTrackProgress() {
        if (!this.slider) return;
        // If we have a constraint, show it visually
        const total = this.availableHours.length - 1;
        if (total <= 0) return;
        
        // Defaults to 100% if unlimited
        let pct = 100;
        if (this.maxPlayableIndex !== Infinity) {
            pct = Math.min(100, Math.max(0, (this.maxPlayableIndex / total) * 100));
        }
        
        // Updates background gradient: Loaded part (0.5 opacity), Unloaded part (0.1 opacity).
        this.slider.style.background = `linear-gradient(to right, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.5) ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`;
    }

    _emitHours() {
        if (!this.onChange) return;
        const leadHours = (this.availableHours[this.currentIndex] !== undefined) ? this.availableHours[this.currentIndex] : (this.availableHours[0] || 1);
        this.onChange(leadHours);
    }

    _updateLabel() {
        if (!this.label) return;
        const leadHours = (this.availableHours[this.currentIndex] !== undefined) ? this.availableHours[this.currentIndex] : (this.availableHours[0] || 1);
        
        let mainText = '';
        if (!this.initTime) {
            mainText = `Lead ${leadHours}h`;
        } else {
            const ts = new Date(this.initTime.getTime() + leadHours * 60 * 60 * 1000);
            const timeStr = this.showLocalTime ? formatLocal(ts) : formatUTC(ts);
            mainText = `${timeStr} (Lead ${leadHours}h)`;
        }

        this.label.innerHTML = '';
        this.label.appendChild(document.createTextNode(mainText));

        if (this.bgLoading && this.bgLoading.active) {
            const spinner = document.createElement('span');
            spinner.className = 'pf-timeslider-spinner';
            this.label.appendChild(spinner);
            
            const progress = document.createElement('span');
            progress.className = 'pf-timeslider-loading-text';
            progress.textContent = `${this.bgLoading.done}/${this.bgLoading.total}`;
            this.label.appendChild(progress);
        }
    }

    _setIndex(idx) {
        const maxIndex = Math.max(0, this.availableHours.length - 1);
        // Clamp to playable range if set
        const limit = (this.maxPlayableIndex !== Infinity) ? Math.min(maxIndex, this.maxPlayableIndex) : maxIndex;
        
        const clamped = Math.min(limit, Math.max(0, idx));
        this.currentIndex = clamped;
        if (this.slider) this.slider.value = String(clamped);
        this._updateLabel();
        this._emitHours();
    }

    stepBy(delta) {
        this._setIndex(this.currentIndex + delta);
    }

    setLeadHour(hour) {
        const idx = this.availableHours.indexOf(hour);
        if (idx !== -1) {
            this._setIndex(idx);
        }
    }

    _markLastActive(source) {
        this._lastActive = source;
    }
}



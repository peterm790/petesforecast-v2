// Build-time discovery of available colormaps using Vite's globbing
const CPT_FILES = import.meta.glob('/src/assets/cmaps/cpt-city/**/*.cpt', { query: '?raw', import: 'default' });
import weatherVariables from '../assets/weather_variables.json';
import { fetchInitTimeRange, generateInitTimes6h } from '../util.js';

function buildColormapIndex() {
    /** @type {Record<string, Set<string>>} */
    const genreToNamesSet = {};
    for (const path of Object.keys(CPT_FILES)) {
        // Example: /src/assets/cmaps/cpt-city/cmocean/sub/folder/thermal.cpt
        const segments = path.split('/');
        const idx = segments.indexOf('cpt-city');
        if (idx === -1 || idx + 1 >= segments.length) continue;
        const genre = segments[idx + 1];
        const file = segments[segments.length - 1];
        const base = file.endsWith('.cpt') ? file.slice(0, -4) : file;
        const subparts = segments.slice(idx + 2, segments.length - 1); // parts under the genre
        const name = subparts.length ? `${subparts.join('/')}/${base}` : base;
        if (!genreToNamesSet[genre]) genreToNamesSet[genre] = new Set();
        genreToNamesSet[genre].add(name);
    }
    /** @type {Record<string, string[]>} */
    const genreToNames = {};
    const genres = Object.keys(genreToNamesSet).sort();
    for (const g of genres) {
        genreToNames[g] = Array.from(genreToNamesSet[g]).sort();
    }
    return { genres, genreToNames };
}

const COLOR_MAP_INDEX = buildColormapIndex();

export class MenuBar {
    constructor(options = {}) {
        const {
            mount = null,
            initialState = {},
            onChange = null
        } = options;

        this.mountTarget = mount;
        this.onChange = typeof onChange === 'function' ? onChange : null;
        this.state = {
            initData: initialState.initData || '00Z',
            frequency: initialState.frequency || 'long-term',
            variable: initialState.variable || 'temperature',
            colormapGenre: initialState.colormapGenre || 'sequential',
            colormap: initialState.colormap || 'thermal',
            unit: initialState.unit || null
        };

        this.root = null;
        this.sidebar = null;
        this.wrap = null;
        this.genreSelect = null;
        this.colormapSelect = null;
        this.unitSelect = null;
        this.minSlider = null;
        this.maxSlider = null;
        this.rangeTitle = null;
        this._handleEsc = this._handleEsc.bind(this);
    }

    mount(target) {
        const host = target || this.mountTarget || document.body;
        if (!host) throw new Error('MenuBar: no mount target provided');

        if (this.root) return; // already mounted

        const root = document.createElement('div');
        root.className = 'pf-menubar-container';

        const wrap = document.createElement('div');
        wrap.className = 'pf-menubar-wrap';

        const toggle = document.createElement('button');
        toggle.className = 'pf-menubar-open';
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.textContent = '▸';

        const sidebar = document.createElement('div');
        sidebar.className = 'pf-menubar-sidebar';

        // Set refs early so helpers can rely on them
        this.root = root;
        this.wrap = wrap;
        this.sidebar = sidebar;

        // Sections
        sidebar.appendChild(this._createInitDatePanel());

        sidebar.appendChild(this._createFrequencyPanel());

        sidebar.appendChild(this._createVariablePanel());
        sidebar.appendChild(this._createUnitPanel());

        sidebar.appendChild(this._createGenrePanel());
        sidebar.appendChild(this._createColormapPanel());
        sidebar.appendChild(this._createRangePanel());

        // Open button shows panel and hides itself
        toggle.addEventListener('click', () => {
            this.wrap.classList.remove('hidden');
            toggle.style.display = 'none';
        });

        wrap.appendChild(sidebar);
        root.appendChild(toggle);
        root.appendChild(wrap);

        // Add compact close button inside the panel
        const close = document.createElement('button');
        close.className = 'pf-menubar-close';
        close.setAttribute('aria-label', 'Close menu');
        close.textContent = '×';
        close.addEventListener('click', () => {
            this.wrap.classList.add('hidden');
            toggle.style.display = '';
        });
        sidebar.appendChild(close);
        host.appendChild(root);

        // Start with menu open; hide external open button initially
        toggle.style.display = 'none';
        document.addEventListener('keydown', this._handleEsc);

        // Ensure initial state is valid and apply per-variable defaults
        this._ensureValidVariableState();
        this._applyVariableColormapDefaults();
        this._ensureValidColormapState();
        this._applyVariableUnitDefault();
        this._ensureValidDataRange();
        this._populateGenreSelect();
        this._populateColormapSelect();
        this._populateVariableSelect();
        this._populateUnitSelect();
        this._populateRangeSliders();
    }

    unmount() {
        if (!this.root) return;
        document.removeEventListener('keydown', this._handleEsc);
        this.root.remove();
        this.root = null;
        this.sidebar = null;
    }

    destroy() { this.unmount(); }

    getState() { return { ...this.state }; }

    setState(partial) {
        const prev = this.state;
        this.state = { ...this.state, ...partial };
        const changedKeys = Object.keys(partial);
        const requiresPreload = changedKeys.some(k => k === 'variable' || k === 'frequency' || k === 'initData');
        // Always refresh local UI for immediate feedback
        this._refreshUI();
        // Notify consumer with metadata so it can decide whether to preload
        this._notify({ changedKeys, requiresPreload });
    }

    _notify(meta = undefined) {
        if (this.onChange) this.onChange(this.getState(), meta);
    }

    _handleEsc(e) {
        if (e.key === 'Escape' && this.wrap) this.wrap.classList.add('hidden');
    }

    _createPanelContainer(titleText) {
        const panel = document.createElement('div');
        panel.className = 'pf-menubar-panel';
        const label = document.createElement('label');
        label.className = 'pf-menubar-label';
        label.textContent = titleText;
        panel.appendChild(label);
        return { panel, label };
    }

    _createSelectPanel(title, key, options) {
        const { panel } = this._createPanelContainer(title);
        const select = document.createElement('select');
        select.className = 'pf-menubar-select';

        for (const [value, text] of options) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = text;
            if (this.state[key] === value) opt.selected = true;
            select.appendChild(opt);
        }

        select.addEventListener('change', () => {
            this.setState({ [key]: select.value });
        });

        panel.appendChild(select);
        return panel;
    }

    _createInitDatePanel() {
        const { panel } = this._createPanelContainer('Init Date');
        const select = document.createElement('select');
        select.className = 'pf-menubar-select';
        select.disabled = true;

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Loading...';
        placeholder.selected = true;
        select.appendChild(placeholder);

        panel.appendChild(select);

        // Fetch and populate asynchronously
        (async () => {
            try {
                const [first, latest] = await fetchInitTimeRange();
                const datesAsc = generateInitTimes6h(first, latest);
                const dates = datesAsc.slice().reverse(); // latest first

                const formatLocal = (date) => {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mm = String(date.getMinutes()).padStart(2, '0');
                    const tzPart = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(date).find(p => p.type === 'timeZoneName');
                    const tz = tzPart ? tzPart.value : 'local';
                    return `${y}-${m}-${d} ${hh}:${mm} ${tz}`;
                };

                select.innerHTML = '';
                for (const d of dates) {
                    const iso = new Date(d.getTime()).toISOString().replace('.000Z', 'Z');
                    const label = formatLocal(d);
                    const opt = document.createElement('option');
                    opt.value = iso; // keep value in UTC ISO for consistency
                    opt.textContent = label; // display in local time
                    if (!this.state.initData) this.state.initData = iso;
                    if (this.state.initData === iso) opt.selected = true;
                    select.appendChild(opt);
                }
                select.disabled = false;
            } catch (err) {
                select.innerHTML = '';
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Error loading init times';
                opt.selected = true;
                select.appendChild(opt);
                // Respect user rule: raise errors, no silent fallbacks
                throw err;
            }
        })();

        select.addEventListener('change', () => {
            this.setState({ initData: select.value });
        });

        return panel;
    }

    _createFrequencyPanel() {
        const { panel } = this._createPanelContainer('Frequency');
        const select = document.createElement('select');
        select.className = 'pf-menubar-select';
        const opts = [
            ['24h', '24 Hours'],
            ['3d', '3 Days'],
            ['5d', '5 Days'],
            ['16d-3h', '16 Days (3 Hourly)']
        ];
        for (const [value, text] of opts) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = text;
            if (this.state.frequency === value) opt.selected = true;
            select.appendChild(opt);
        }
        select.addEventListener('change', () => this.setState({ frequency: select.value }));
        panel.appendChild(select);
        return panel;
    }

    _createVariablePanel() {
        const { panel } = this._createPanelContainer('Variable');
        const select = document.createElement('select');
        select.className = 'pf-menubar-select';
        this.variableSelect = select;
        select.addEventListener('change', () => {
            const v = select.value;
            const def = weatherVariables[v] || {};
            const newGenre = def.cmapGenre || this.state.colormapGenre;
            const newMap = def.cmapName || this.state.colormap;
            // Reset unit to variable default on variable change
            const nextUnit = (def && (def.defaultUnit || def.unit)) || this.state.unit || '';
            this.setState({ variable: v, unit: nextUnit, dataMin: undefined, dataMax: undefined, colormapGenre: newGenre, colormap: newMap });
            this._ensureValidColormapState();
            this._populateGenreSelect();
            this._populateColormapSelect();
            this._populateUnitSelect();
            this._ensureValidDataRange();
            this._populateRangeSliders();
        });
        panel.appendChild(select);
        return panel;
    }

    _createUnitPanel() {
        const { panel } = this._createPanelContainer('Unit');
        const select = document.createElement('select');
        select.className = 'pf-menubar-select';
        this.unitSelect = select;
        select.addEventListener('change', () => {
            const def = weatherVariables[this.state.variable];
            const prevUnit = this.state.unit || (def && (def.defaultUnit || def.unit));
            const newUnit = select.value;
            // Convert current dataMin/Max from prevUnit -> native -> newUnit
            const { toNative: prevToNative } = this._getUnitConv(def, prevUnit);
            const { fromNative: nextFromNative } = this._getUnitConv(def, newUnit);
            const toNative = (x) => prevToNative.a * x + prevToNative.b;
            const fromNative = (x) => nextFromNative.a * x + nextFromNative.b;
            const nativeMin = toNative(typeof this.state.dataMin === 'number' ? this.state.dataMin : def.min);
            const nativeMax = toNative(typeof this.state.dataMax === 'number' ? this.state.dataMax : def.max);
            const newMin = fromNative(nativeMin);
            const newMax = fromNative(nativeMax);
            this.setState({ unit: newUnit, dataMin: newMin, dataMax: newMax });
            this._ensureValidDataRange();
            this._populateRangeSliders();
        });
        panel.appendChild(select);
        return panel;
    }

    _createGenrePanel() {
        const { panel } = this._createPanelContainer('Colormap Genre');
        const select = document.createElement('select');
        select.className = 'pf-menubar-select';
        this.genreSelect = select;
        select.addEventListener('change', () => {
            const newGenre = select.value;
            let newColormap = this.state.colormap;
            const available = this._getColormapsForGenre(newGenre);
            if (!available.includes(newColormap)) {
                newColormap = available[0] || '';
            }
            this.setState({ colormapGenre: newGenre, colormap: newColormap });
            this._populateColormapSelect();
        });
        panel.appendChild(select);
        return panel;
    }

    _createColormapPanel() {
        const { panel } = this._createPanelContainer('Colormap');
        const select = document.createElement('select');
        select.className = 'pf-menubar-select';
        this.colormapSelect = select;
        select.addEventListener('change', () => {
            this.setState({ colormap: select.value });
        });
        panel.appendChild(select);
        return panel;
    }

    _createRangePanel() {
        const { panel } = this._createPanelContainer('Data Range');
        const title = document.createElement('div');
        title.className = 'pf-menubar-range-title';
        title.textContent = this._rangeTitleText();
        this.rangeTitle = title;
        panel.appendChild(title);

        const row = document.createElement('div');
        row.className = 'pf-menubar-range-row';

        const minLabel = document.createElement('div');
        minLabel.className = 'pf-menubar-range-min';
        const maxLabel = document.createElement('div');
        maxLabel.className = 'pf-menubar-range-max';

        const wrap = document.createElement('div');
        wrap.className = 'pf-menubar-range-wrap';
        const highlight = document.createElement('div');
        highlight.className = 'pf-menubar-range-highlight';
        const minInput = document.createElement('input');
        const maxInput = document.createElement('input');
        minInput.type = 'range';
        maxInput.type = 'range';
        minInput.className = 'pf-min';
        maxInput.className = 'pf-max';
        this.minSlider = minInput;
        this.maxSlider = maxInput;

        const updateLabels = () => {
            minLabel.textContent = String(this.state.dataMin);
            maxLabel.textContent = String(this.state.dataMax);
            title.textContent = this._rangeTitleText();
        };

        minInput.addEventListener('input', () => {
            const minVal = Number(minInput.value);
            const maxVal = Number(this.maxSlider.value);
            if (minVal > maxVal) this.maxSlider.value = String(minVal);
            this.setState({ dataMin: Number(this.minSlider.value), dataMax: Number(this.maxSlider.value) });
            updateLabels();
        });
        maxInput.addEventListener('input', () => {
            const minVal = Number(this.minSlider.value);
            const maxVal = Number(maxInput.value);
            if (maxVal < minVal) this.minSlider.value = String(maxVal);
            this.setState({ dataMin: Number(this.minSlider.value), dataMax: Number(this.maxSlider.value) });
            updateLabels();
        });

        wrap.appendChild(highlight);
        wrap.appendChild(minInput);
        wrap.appendChild(maxInput);
        row.appendChild(minLabel);
        row.appendChild(wrap);
        row.appendChild(maxLabel);
        panel.appendChild(row);
        const close = document.createElement('button');
        close.className = 'pf-menubar-close';
        close.setAttribute('aria-label', 'Close menu');
        close.textContent = '×';
        close.addEventListener('click', () => {
            this.wrap.classList.add('hidden');
            const openBtn = this.root.querySelector('.pf-menubar-open');
            if (openBtn) openBtn.style.display = '';
        });
        this.sidebar.appendChild(close);
        const redrawHighlight = () => {
            const min = Number(this.minSlider.min);
            const max = Number(this.maxSlider.max);
            const vmin = Number(this.minSlider.value);
            const vmax = Number(this.maxSlider.value);
            const span = max - min || 1;
            const leftPct = ((vmin - min) / span) * 100;
            const rightPct = 100 - ((vmax - min) / span) * 100;
            highlight.style.left = leftPct + '%';
            highlight.style.right = rightPct + '%';
        };
        const updateAndRedraw = () => { updateLabels(); redrawHighlight(); };
        minInput.addEventListener('input', updateAndRedraw);
        maxInput.addEventListener('input', updateAndRedraw);
        // initial
        setTimeout(redrawHighlight, 0);

        return panel;
    }

    _populateGenreSelect() {
        if (!this.genreSelect) return;
        const genres = this._getGenres();
        this.genreSelect.innerHTML = '';
        for (const g of genres) {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g;
            if (this.state.colormapGenre === g) opt.selected = true;
            this.genreSelect.appendChild(opt);
        }
    }

    _populateColormapSelect() {
        if (!this.colormapSelect) return;
        const names = this._getColormapsForGenre(this.state.colormapGenre);
        this.colormapSelect.innerHTML = '';
        for (const n of names) {
            const opt = document.createElement('option');
            opt.value = n;
            opt.textContent = n;
            if (this.state.colormap === n) opt.selected = true;
            this.colormapSelect.appendChild(opt);
        }
    }

    _populateRangeSliders() {
        if (!this.minSlider || !this.maxSlider) return;
        const def = weatherVariables[this.state.variable];
        if (!def) return;
        // Convert native min/max to selected unit for UI sliders
        const { fromNative } = this._getUnitConv(def, this.state.unit || def.unit);
        const min = Number(fromNative.a * Number(def.min) + fromNative.b);
        const max = Number(fromNative.a * Number(def.max) + fromNative.b);
        const step = (max - min) / 100 || 1;
        this.minSlider.min = String(min);
        this.minSlider.max = String(max);
        this.minSlider.step = String(step);
        this.maxSlider.min = String(min);
        this.maxSlider.max = String(max);
        this.maxSlider.step = String(step);
        this.minSlider.value = String(this.state.dataMin);
        this.maxSlider.value = String(this.state.dataMax);
        if (this.rangeTitle) this.rangeTitle.textContent = this._rangeTitleText();
        // redraw highlight after bounds/value change
        const evt = new Event('input');
        this.minSlider.dispatchEvent(evt);
    }

    _populateVariableSelect() {
        if (!this.variableSelect) return;
        const vars = this._getVariables();
        this.variableSelect.innerHTML = '';
        for (const v of vars) {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            if (this.state.variable === v) opt.selected = true;
            this.variableSelect.appendChild(opt);
        }
    }

    _getGenres() {
        return COLOR_MAP_INDEX.genres;
    }

    _getColormapsForGenre(genre) {
        return COLOR_MAP_INDEX.genreToNames[genre] || [];
    }

    _getVariables() {
		const hidden = new Set([
			'wind_u_10m',
			'wind_v_10m',
			'wind_u_100m',
			'wind_v_100m',
			'wind_vector_10m',
			'wind_vector_100m'
		]);
		return Object.keys(weatherVariables || {}).filter(v => !hidden.has(v)).sort();
    }

    _ensureValidColormapState() {
        const genres = this._getGenres();
        if (genres.length === 0) {
            throw new Error('No colormap genres found under src/assets/cmaps/cpt-city');
        }
        if (!genres.includes(this.state.colormapGenre)) {
            this.state.colormapGenre = genres[0];
        }
        const names = this._getColormapsForGenre(this.state.colormapGenre);
        if (names.length === 0) {
            throw new Error(`No colormaps found for genre ${this.state.colormapGenre}`);
        }
        if (!names.includes(this.state.colormap)) {
            this.state.colormap = names[0];
        }
    }

    _applyVariableColormapDefaults() {
        const def = weatherVariables[this.state.variable];
        if (!def) return;
        if (def.cmapGenre) this.state.colormapGenre = def.cmapGenre;
        if (def.cmapName) this.state.colormap = def.cmapName;
    }

    _refreshUI() {
        // No-op for now; buttons update themselves on click.
    }

    _ensureValidVariableState() {
        const vars = this._getVariables();
        if (vars.length === 0) {
            throw new Error('No weather variables found in assets/weather_variables.json');
        }
        if (!vars.includes(this.state.variable)) {
            this.state.variable = vars[0];
        }
    }

    _ensureValidDataRange() {
        const def = weatherVariables[this.state.variable];
        const { fromNative } = def ? this._getUnitConv(def, this.state.unit || (def.defaultUnit || def.unit)) : { fromNative: { a: 1, b: 0 } };
        const min = def ? (fromNative.a * def.min + fromNative.b) : 0;
        const max = def ? (fromNative.a * def.max + fromNative.b) : 1;
        if (typeof this.state.dataMin !== 'number') this.state.dataMin = min;
        if (typeof this.state.dataMax !== 'number') this.state.dataMax = max;
        if (this.state.dataMin < min) this.state.dataMin = min;
        if (this.state.dataMax > max) this.state.dataMax = max;
        if (this.state.dataMin > this.state.dataMax) this.state.dataMin = this.state.dataMax;
    }

    _rangeTitleText() {
        const def = weatherVariables[this.state.variable];
        const unitStr = (this.state.unit || (def && (def.defaultUnit || def.unit))) || '';
        const unit = unitStr ? ` (${unitStr})` : '';
        return `${this.state.variable}${unit}`;
    }

    _applyVariableUnitDefault() {
        const def = weatherVariables[this.state.variable];
        if (!def) return;
        const unit = this.state.unit || def.defaultUnit || def.unit || '';
        this.state.unit = unit;
    }

    _populateUnitSelect() {
        if (!this.unitSelect) return;
        const def = weatherVariables[this.state.variable];
        const units = (def && Array.isArray(def.units) && def.units.length > 0) ? def.units : [def && def.unit ? def.unit : ''];
        this.unitSelect.innerHTML = '';
        for (const u of units) {
            const opt = document.createElement('option');
            opt.value = u;
            opt.textContent = u;
            if (this.state.unit === u) opt.selected = true;
            this.unitSelect.appendChild(opt);
        }
    }

    _getUnitConv(def, unit) {
        // Returns affine coeffs to convert from native to unit and unit to native
        const nativeUnit = def && def.unit;
        if (!def) throw new Error('No definition for variable');
        if (!unit || unit === nativeUnit) {
            return { fromNative: { a: 1, b: 0 }, toNative: { a: 1, b: 0 } };
        }
        if (!def.convert || !def.convert[unit]) {
            throw new Error(`Unit ${unit} not supported for ${def.commonName || 'variable'}`);
        }
        const conv = def.convert[unit];
        const fromNative = conv.fromNative || { a: 1, b: 0 };
        const toNative = conv.toNative || { a: 1, b: 0 };
        return { fromNative, toNative };
    }
}



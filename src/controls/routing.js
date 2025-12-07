import mapboxgl from 'mapbox-gl';
import { LoadingOverlay } from '../loading_overlay/loading.js';
import { formatLocal, formatUTC } from '../util.js';
import './routing.css';

export class RoutingControl {
    constructor(map) {
        this.map = map;
        this.loadingOverlay = new LoadingOverlay();
        this.state = {
            start: null, // [lng, lat]
            end: null,   // [lng, lat]
            bbox: null,   // [minLon, minLat, maxLon, maxLat]
            leadTimeStart: 0, // Default start lead time (hours)
            initTimeIndex: -1, // Default to latest
            frequency: '1hr', // Default API frequency
            polar_file: 'volvo70'
        };
        this.showLocalTime = true;
        this.routeData = null; // Store API response for time lookup
        this.isochronePoints = []; // Accumulate all isochrone points

        // Markers
        this.startMarker = null;
        this.endMarker = null;
        this.bboxMarkers = { sw: null, ne: null }; // Draggable corners

        // UI Elements
        this.container = null;
        this.startInputLat = null;
        this.startInputLon = null;
        this.endInputLat = null;
        this.endInputLon = null;
        this.bboxInputs = {
            minLon: null, minLat: null, maxLon: null, maxLat: null
        };
        this.timeSelect = null;
        
        // Context Menu
        this.contextMenuElement = null;
        this.contextMenuPopup = null;
        this.contextMenuPos = null; // [lng, lat]

        this._onMapRightClick = this._onMapRightClick.bind(this);
        this._onMapClick = this._onMapClick.bind(this);
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._updateFromMarkers = this._updateFromMarkers.bind(this);
        this._updateFromInputs = this._updateFromInputs.bind(this);
        this._updateBBoxFromCorners = this._updateBBoxFromCorners.bind(this);
        
        // Callbacks
        this.onRouteLoadedHandler = null;
        
        // Touch handling state
        this.longPressTimer = null;
        this.touchStartPoint = null;
    }

    onRouteLoaded(callback) {
        this.onRouteLoadedHandler = callback;
    }

    isContextMenuActive() {
        return this._justOpenedContextMenu || (this.contextMenuPopup && this.contextMenuPopup.isOpen());
    }

    mount(target) {
        this._createUI(target);
        this._initMapLayers();
        this._initContextMenu();
        
        this.map.on('contextmenu', this._onMapRightClick);
        this.map.on('click', this._onMapClick); // To close context menu or trigger cmd-click
        
        // Unified Long Press Handling (Touch & Mouse)
        this.map.on('mousedown', this._onPointerDown);
        this.map.on('touchstart', this._onPointerDown);
        
        this.map.on('mousemove', this._onPointerMove);
        this.map.on('touchmove', this._onPointerMove);
        
        this.map.on('mouseup', this._onPointerUp);
        this.map.on('touchend', this._onPointerUp);
    }

    unmount() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        if (this.contextMenuPopup) {
            this.contextMenuPopup.remove();
            this.contextMenuPopup = null;
        }
        this.contextMenuElement = null;
        this._removeMapLayers();
        this._removeMarkers();
        this.map.off('contextmenu', this._onMapRightClick);
        this.map.off('click', this._onMapClick);
        
        this.map.off('mousedown', this._onPointerDown);
        this.map.off('touchstart', this._onPointerDown);
        
        this.map.off('mousemove', this._onPointerMove);
        this.map.off('touchmove', this._onPointerMove);
        
        this.map.off('mouseup', this._onPointerUp);
        this.map.off('touchend', this._onPointerUp);
    }

    _createUI(target) {
        const host = target || document.body;

        const container = document.createElement('div');
        container.className = 'pf-routing-container';

        // Mount loading overlay inside this container so it covers the menu
        // But LoadingOverlay usually mounts to a target. Let's mount it to the sidebar or wrap.
        
        const openBtn = document.createElement('div');
        openBtn.className = 'pf-routing-open';
        openBtn.id = 'pf-routing-open-btn';
        openBtn.innerHTML = '☡'; // Or some other icon
        openBtn.onclick = () => {
            wrap.classList.remove('hidden');
            openBtn.style.display = 'none';
        };

        const wrap = document.createElement('div');
        wrap.className = 'pf-routing-wrap hidden'; // Start hidden or visible? User said "toggle button to collapse/expand"

        // Sidebar
        const sidebar = document.createElement('div');
        sidebar.className = 'pf-routing-sidebar';

        // Close Button
        const closeBtn = document.createElement('div');
        closeBtn.className = 'pf-routing-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => {
            wrap.classList.add('hidden');
            openBtn.style.display = 'flex';
        };
        sidebar.appendChild(closeBtn);

        // --- FORM VIEW ---
        const formView = document.createElement('div');
        formView.style.display = 'flex';
        formView.style.flexDirection = 'column';
        formView.style.gap = '0.6rem';
        this.formView = formView;

        // Start Location Panel
        formView.appendChild(this._createLocationPanel('Start Location', 'start'));

        // End Location Panel
        formView.appendChild(this._createLocationPanel('End Location', 'end'));

        // Bounding Box Panel
        formView.appendChild(this._createBBoxPanel());

        // Start Time Panel
        formView.appendChild(this._createTimePanel());

        // Polar File Panel
        formView.appendChild(this._createPolarPanel());

        // Run Route Button
        const runBtn = document.createElement('button');
        runBtn.className = 'pf-routing-button';
        runBtn.textContent = 'Run Route';
        runBtn.style.marginTop = '10px';
        runBtn.onclick = () => this._runRoute();
        runBtn.disabled = true; // Disabled by default
        this.runButton = runBtn; // Save ref
        formView.appendChild(runBtn);

        sidebar.appendChild(formView);

        // --- RESULT VIEW ---
        const resultView = document.createElement('div');
        resultView.style.display = 'none';
        resultView.style.flexDirection = 'column';
        resultView.style.gap = '0.6rem';
        this.resultView = resultView;

        // Result Title
        const resTitle = document.createElement('div');
        resTitle.className = 'pf-routing-label';
        resTitle.textContent = 'Route Data';
        resultView.appendChild(resTitle);

        // Result Container (Panel style for better contrast)
        const resPanel = document.createElement('div');
        resPanel.className = 'pf-routing-panel';
        resPanel.style.padding = '8px 12px'; // Custom padding
        
        // Result Table
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.fontSize = '13px';
        table.style.borderCollapse = 'collapse';
        
        // Row helper
        const addRow = (label, id) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            
            const td1 = document.createElement('td');
            td1.textContent = label;
            td1.style.padding = '8px 0'; // slightly reduced horizontal padding
            td1.style.color = '#aaa'; // slightly lighter grey for better contrast on dark
            
            const td2 = document.createElement('td');
            td2.style.textAlign = 'right';
            td2.style.fontWeight = '600';
            td2.style.color = '#fff'; // Bright white for value
            td2.id = `pf-route-val-${id}`;
            td2.textContent = '-';
            
            tr.appendChild(td1);
            tr.appendChild(td2);
            table.appendChild(tr);
        };

        addRow('Time', 'time');
        addRow('Lat / Lon', 'pos');
        addRow('TWS', 'tws');
        addRow('TWD', 'twd');
        addRow('TWA', 'twa');
        addRow('Heading', 'hdg');
        addRow('Boat Speed', 'spd');
        
        resPanel.appendChild(table);
        resultView.appendChild(resPanel);

        // Clear Button (Only visible in Result View)
        const clearBtn = document.createElement('button');
        clearBtn.className = 'pf-routing-button';
        clearBtn.textContent = 'Clear';
        clearBtn.style.marginTop = '5px';
        clearBtn.onclick = () => this.clearAll();
        resultView.appendChild(clearBtn);

        sidebar.appendChild(resultView);

        wrap.appendChild(sidebar);
        container.appendChild(openBtn);
        container.appendChild(wrap);
        host.appendChild(container);
        this.container = container;
        
        // Mount loading overlay to the sidebar to cover the controls
        this.loadingOverlay.mount(sidebar);
        
        // Initially show open button and hide menu, or vice versa?
        // User requested: "routing menu be close by default"
        wrap.classList.add('hidden');
        openBtn.style.display = 'flex';
    }

    _createLocationPanel(title, prefix) {
        const panel = document.createElement('div');
        panel.className = 'pf-routing-panel';
        panel.id = `pf-routing-${prefix}-panel`;

        const label = document.createElement('div');
        label.className = 'pf-routing-label';
        label.textContent = title;
        panel.appendChild(label);

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';

        const latIn = document.createElement('input');
        latIn.type = 'number';
        latIn.className = 'pf-routing-input';
        latIn.placeholder = 'Lat';
        latIn.step = '0.0001';
        
        const lonIn = document.createElement('input');
        lonIn.type = 'number';
        lonIn.className = 'pf-routing-input';
        lonIn.placeholder = 'Lon';
        lonIn.step = '0.0001';

        if (prefix === 'start') {
            this.startInputLat = latIn;
            this.startInputLon = lonIn;
        } else {
            this.endInputLat = latIn;
            this.endInputLon = lonIn;
        }

        [latIn, lonIn].forEach(input => {
            input.addEventListener('change', this._updateFromInputs);
            input.addEventListener('input', this._updateFromInputs);
        });

        row.appendChild(latIn);
        row.appendChild(lonIn);
        panel.appendChild(row);

        return panel;
    }

    _createBBoxPanel() {
        const panel = document.createElement('div');
        panel.className = 'pf-routing-panel';
        panel.id = 'pf-routing-bbox-panel';

        const label = document.createElement('div');
        label.className = 'pf-routing-label';
        label.textContent = 'Bounding Box';
        panel.appendChild(label);

        // Min Lat / Max Lat
        const latRow = document.createElement('div');
        latRow.style.display = 'flex';
        latRow.style.gap = '8px';
        latRow.style.marginBottom = '8px';
        
        const minLatIn = document.createElement('input');
        minLatIn.type = 'number';
        minLatIn.className = 'pf-routing-input';
        minLatIn.placeholder = 'Min Lat';
        minLatIn.step = '0.1';

        const maxLatIn = document.createElement('input');
        maxLatIn.type = 'number';
        maxLatIn.className = 'pf-routing-input';
        maxLatIn.placeholder = 'Max Lat';
        maxLatIn.step = '0.1';

        latRow.appendChild(minLatIn);
        latRow.appendChild(maxLatIn);

        // Min Lon / Max Lon
        const lonRow = document.createElement('div');
        lonRow.style.display = 'flex';
        lonRow.style.gap = '8px';

        const minLonIn = document.createElement('input');
        minLonIn.type = 'number';
        minLonIn.className = 'pf-routing-input';
        minLonIn.placeholder = 'Min Lon';
        minLonIn.step = '0.1';

        const maxLonIn = document.createElement('input');
        maxLonIn.type = 'number';
        maxLonIn.className = 'pf-routing-input';
        maxLonIn.placeholder = 'Max Lon';
        maxLonIn.step = '0.1';

        lonRow.appendChild(minLonIn);
        lonRow.appendChild(maxLonIn);

        panel.appendChild(latRow);
        panel.appendChild(lonRow);

        this.bboxInputs.minLat = minLatIn;
        this.bboxInputs.maxLat = maxLatIn;
        this.bboxInputs.minLon = minLonIn;
        this.bboxInputs.maxLon = maxLonIn;

        [minLatIn, maxLatIn, minLonIn, maxLonIn].forEach(inp => {
            inp.addEventListener('change', () => this._updateBBoxFromInputs());
            inp.addEventListener('input', () => this._updateBBoxFromInputs()); // Real-time?
        });

        return panel;
    }

    _createTimePanel() {
        const panel = document.createElement('div');
        panel.className = 'pf-routing-panel';
        panel.id = 'pf-routing-time-panel';

        const label = document.createElement('div');
        label.className = 'pf-routing-label';
        label.textContent = 'Start Time';
        panel.appendChild(label);

        const select = document.createElement('select');
        select.className = 'pf-routing-input';
        select.style.cursor = 'pointer';
        // Default option
        const opt = document.createElement('option');
        opt.value = '0';
        opt.textContent = 'Loading...';
        select.appendChild(opt);
        
        select.addEventListener('change', () => {
            this.state.leadTimeStart = parseInt(select.value, 10);
        });

        this.timeSelect = select;
        select.id = 'pf-routing-time-select';
        panel.appendChild(select);
        return panel;
    }

    _createPolarPanel() {
        const panel = document.createElement('div');
        panel.className = 'pf-routing-panel';
        panel.id = 'pf-routing-polar-panel';

        const label = document.createElement('div');
        label.className = 'pf-routing-label';
        label.textContent = 'Boat Polar';
        panel.appendChild(label);

        const select = document.createElement('select');
        select.className = 'pf-routing-input';
        select.style.cursor = 'pointer';
        select.id = 'pf-routing-polar-select';

        const options = [
            "Akilaria40_rc2", "Alberg35", "Alden52", "Amel_54", "Amel_55", "Amel_64", "Amel_euros41", "Amel_kirk", 
            "Amel_maramu", "Amel_sharki", "Amel_supermaramu2000", "Bavaria32", "Bavaria33", "Bavaria34", "Bavaria38", 
            "Bavaria44", "Bavaria50", "Beneteau375", "Beneteau421", "Beowulf78", "BlockIsland40", "BountyII", 
            "Breehorn37", "C_C34", "C_C372", "C_C402", "C_C44", "Cal2-46", "Cal239", "Cal36", "Cal40", "Catalina36", 
            "Catamaran38", "Catamaran54", "Cheoy_Lee44", "Class40", "Class40v2", "Colombia43", "Colombia50", 
            "Contessa33", "Crealock34", "Deerfoot2_62", "Deerfoot62", "Deerfoot64K", "Deerfoot_74", "Dehler29", 
            "Dehler32", "Dehler33", "Dehler34", "Dehler35", "Dehler36", "Dehler38", "Dehler41", "Dehler44", 
            "Dragonfly28", "Dufour24", "Dufour27", "Dufour34", "Dufour34_1974", "Dufour4800", "Dufour485", 
            "Dufour_Sylphe", "Elan350", "Elan37", "Elan450", "Endeavor40", "Erickson29", "Etap32i", "Evasion32", 
            "Evasion34", "Express27", "Express37", "Farr36od", "Farr39CR", "Farr40", "Figaro2", "Figaro_1", 
            "First210", "First21_7", "First24", "First25_7", "First26", "First27_7", "First29", "First30jk", 
            "First310s", "First31_7", "First325gte", "First32s5", "First34_7", "First36_7", "First40_7", "First45", 
            "FirstClass10", "Freedom44CB", "Gibsea442", "Gladiateur", "GrandSurprise", "Grandsoleil341", 
            "Grandsoleil37", "Grandsoleil40", "Grandsoleil42", "Grandsoleil43", "Grandsoleil45", "Grandsoleil46", 
            "Gulfstar50", "Hallberg-rassy310", "Hallberg-rassy342", "Hallberg-rassy372", "Hallberg-rassy40", 
            "Hallberg-rassy412", "Hallberg-rassy43mklll", "Hallberg-rassy48mkll", "Hallberg-rassy55", 
            "Hallberg-rassy64", "Hanse345", "Hanse400", "Hinckley50", "Hunter375", "Hylas54", "ImocaOpen60", 
            "Irwin40", "Irwin54", "Islander36", "J105", "J109", "J120", "J122", "J130", "J133", "J34C", "J40", 
            "Jeanneau41", "Jod35", "Jpk1010", "Jpk960", "Lagoon380", "Landmark43", "Little_Hrb50", "Little_Hrb63", 
            "Little_Hrb_48", "Maxi_multi_2013", "Maxus21", "Melody", "Mini_650", "Morgan41", "Multi50", "Mumm30", 
            "Mumm_30", "Muscadet", "Nacira650", "Najad440", "Navy44", "Newport41", "Norseman447", "Oceanis31", 
            "Oceanis34", "Oceanis351", "Oceanis37", "Passport41", "Pearson33", "Peterson44", "Pogo1050", "Pogo40", 
            "Pogo40_s2", "Pogo650", "Pogo850", "RM1200", "Ranger37", "Sabre362", "Sabre402", "Santacruz50", 
            "Santana35", "Sense46", "Shannon38", "Shock35", "Small_polar", "Sundeer64K", "Sunfast32", "Sunfast3200", 
            "Sunfast32i", "Sunfast36", "Sunfast3600", "Sunfast39tq", "Sunfast40", "Sunkiss45", "Sunlegend41", 
            "Sunmagic44", "Sunodyssey40", "Sunshine38", "Swan37", "Swan38", "Swan39", "Swan391", "Swan40", 
            "Swan44", "Swan45", "Swan46", "Swan46CB", "Swan60", "Symphonie", "Tartan10", "Tartan37", "Tartan40", 
            "Tartan41", "Tayana37", "Tayana42", "Tayana52", "The_Race", "Valiant40", "Valiant47", "VandeStadt_Zeehond", 
            "VolvoOcean65", "X332", "X332sport", "X34", "X35od", "X37", "X40", "X402", "X40carb", "Xc42", "Xc45", 
            "Xc50", "Xp33", "Xp38", "Xp44", "Yankee38", "j80", "volvo70", "Argonaut_Samoa_47"
        ];
        
        options.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        options.forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.textContent = optVal;
            // Select default
            if (optVal === 'volvo70') {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
        
        select.addEventListener('change', () => {
            this.state.polar_file = select.value;
        });

        panel.appendChild(select);
        return panel;
    }

    // Set init time index for API (e.g. -1 for latest)
    setInitTimeIndex(idx) {
        this.state.initTimeIndex = idx;
    }

    setFrequency(uiFreq) {
        // Map UI frequency to API expected '1hr' or '3hr'
        // '16d-3h' -> '3hr', others ('5d', '24h', '3d') -> '1hr'
        this.state.frequency = (uiFreq === '16d-3h') ? '3hr' : '1hr';
    }

    setShowLocalTime(enabled) {
        this.showLocalTime = enabled;
        // Ideally re-render time options if we have data
        // We can't easily re-call setTimeOptions without the args.
        // But index.js calls setTimeOptions on change, so it should be fine.
    }

    // Called by main app to populate time options
    setTimeOptions(leads, initIsoTime) {
        if (!this.timeSelect) return;
        this.timeSelect.innerHTML = '';
        
        if (!leads || leads.length === 0) {
            const opt = document.createElement('option');
            opt.value = '0';
            opt.textContent = 'No times available';
            this.timeSelect.appendChild(opt);
            return;
        }

        let initTimeMs = 0;
        if (initIsoTime) {
            initTimeMs = new Date(initIsoTime).getTime();
        }

        leads.forEach((lead, index) => {
            const opt = document.createElement('option');
            opt.value = String(lead); // Use lead HOURS (Index ~= Hours for <=120)
            
            if (initTimeMs) {
                const date = new Date(initTimeMs + lead * 3600 * 1000);
                
                if (this.showLocalTime) {
                    const formatted = formatLocal(date);
                    // Routing used a shorter format "Mon 12, 14:00" before.
                    // But formatLocal returns "Monday (12/XX) 14:00 GMT+X".
                    // This is longer but consistent.
                    opt.textContent = formatted.replace(/\(.*\)\s/, ''); // Hack to shorten if needed? 
                    // Or just use the standard one.
                    // Let's use the standard one for consistency.
                    opt.textContent = formatted;
                } else {
                    opt.textContent = formatUTC(date);
                }
            } else {
                opt.textContent = `+${lead}h`;
            }

            if (lead === this.state.leadTimeStart) opt.selected = true;
            this.timeSelect.appendChild(opt);
        });
        
        // Reset state if current value is not in leads
        if (!leads.includes(this.state.leadTimeStart)) {
            this.state.leadTimeStart = leads[0];
            this.timeSelect.value = String(leads[0]);
        }
    }

    _initContextMenu() {
        const menu = document.createElement('div');
        menu.className = 'pf-context-menu';
        
        const itemStart = document.createElement('div');
        itemStart.className = 'pf-context-menu-item';
        itemStart.textContent = 'Start Here';
        itemStart.onclick = () => {
            this.setStart(this.contextMenuPos);
            this._hideContextMenu();
        };

        const itemEnd = document.createElement('div');
        itemEnd.className = 'pf-context-menu-item';
        itemEnd.textContent = 'End Here';
        itemEnd.onclick = () => {
            this.setEnd(this.contextMenuPos);
            this._hideContextMenu();
        };

        menu.appendChild(itemStart);
        menu.appendChild(itemEnd);
        // Do not append to body, used in Popup
        this.contextMenuElement = menu;
    }

    _onMapRightClick(e) {
        e.preventDefault();
        this._showContextMenu(e);
    }

    _onMapClick(e) {
        if (this._justOpenedContextMenu) return;

        if (e.originalEvent.metaKey || e.originalEvent.ctrlKey) {
            // Command/Ctrl click
            this._showContextMenu(e);
            return; // Don't hide it immediately
        }
        this._hideContextMenu();
        
        // Also hide the routing menu panel if open (user clicked map)
        if (this.container) {
            const wrap = this.container.querySelector('.pf-routing-wrap');
            const openBtn = this.container.querySelector('.pf-routing-open');
            // Check if it's open (not hidden)
            if (wrap && !wrap.classList.contains('hidden')) {
                wrap.classList.add('hidden');
                if (openBtn) openBtn.style.display = 'flex';
            }
        }
    }

    _onPointerDown(e) {
        // Handle Touch
        if (e.type === 'touchstart') {
             if (e.points.length > 1) return; // Ignore multi-touch
             this.touchStartPoint = e.point;
        } else {
             // Handle Mouse
             if (e.originalEvent.button !== 0) return; // Only Left Click
             this.touchStartPoint = e.point;
        }

        // Capture event data immediately
        const eventData = {
            lngLat: e.lngLat,
            point: e.point,
            originalEvent: e.originalEvent
        };

        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        this.longPressTimer = setTimeout(() => {
            // Long press detected
            this.longPressTimer = null;
            this._showContextMenu(eventData); 
        }, 500); // 500ms for long press
    }

    _onPointerMove(e) {
        if (!this.longPressTimer || !this.touchStartPoint) return;
        const dist = Math.sqrt(
            Math.pow(e.point.x - this.touchStartPoint.x, 2) +
            Math.pow(e.point.y - this.touchStartPoint.y, 2)
        );
        if (dist > 10) { // 10px threshold
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    _onPointerUp(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    _showContextMenu(e) {
        this.contextMenuPos = [e.lngLat.lng, e.lngLat.lat];
        
        // Remove existing popup if any
        this._hideContextMenu();

        this.contextMenuElement.style.display = 'block'; // Ensure visible inside popup

        this.contextMenuPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'pf-context-popup',
            maxWidth: 'none',
            offset: 5
        })
        .setLngLat(e.lngLat)
        .setDOMContent(this.contextMenuElement)
        .addTo(this.map);
        
        // Prevent immediate closing by subsequent click event on touch devices
        this._justOpenedContextMenu = true;
        setTimeout(() => { this._justOpenedContextMenu = false; }, 300);
    }

    _hideContextMenu() {
        if (this.contextMenuPopup) {
            this.contextMenuPopup.remove();
            this.contextMenuPopup = null;
        }
    }

    _initMapLayers() {
        if (this.map.loaded()) {
            this._addLayers();
        } else {
            this.map.once('style.load', () => this._addLayers());
        }
    }

    _addLayers() {
        if (this.map.getSource('pf-routing-source')) return;

        this.map.addSource('pf-routing-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

        // Line Layer (Great Circle)
        this.map.addLayer({
            id: 'pf-routing-line',
            type: 'line',
            source: 'pf-routing-source',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#888888', // Grey for Great Circle
                'line-width': 2,
                'line-dasharray': [2, 1]
            },
            filter: ['==', '$type', 'LineString']
        });

        // BBox Polygon Layer
        this.map.addLayer({
            id: 'pf-routing-bbox',
            type: 'fill',
            source: 'pf-routing-source',
            paint: {
                'fill-color': '#ffffff',
                'fill-opacity': 0.1
            },
            filter: ['==', '$type', 'Polygon']
        });

        this.map.addLayer({
            id: 'pf-routing-bbox-outline',
            type: 'line',
            source: 'pf-routing-source',
            paint: {
                'line-color': '#ffffff',
                'line-width': 1,
                'line-dasharray': [2, 2]
            },
            filter: ['==', '$type', 'Polygon']
        });

        // -- Initial Route Source & Layer --
        if (!this.map.getSource('pf-initial-route-source')) {
            this.map.addSource('pf-initial-route-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!this.map.getLayer('pf-initial-route-line')) {
            this.map.addLayer({
                id: 'pf-initial-route-line',
                type: 'line',
                source: 'pf-initial-route-source',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#0077ff', // Blue for Initial
                    'line-width': 3,
                    'line-opacity': 0.7
                }
            });
        }

        // -- Optimized Route Source & Layer --
        if (!this.map.getSource('pf-result-source')) {
            this.map.addSource('pf-result-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        if (!this.map.getLayer('pf-result-line')) {
            this.map.addLayer({
                id: 'pf-result-line',
                type: 'line',
                source: 'pf-result-source',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#000000', // Black for Final Route
                    'line-width': 4
                }
            });
        }

        // -- Isochrone Points Source & Layer --
        if (!this.map.getSource('pf-isochrone-source')) {
            this.map.addSource('pf-isochrone-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!this.map.getLayer('pf-isochrone-points')) {
            this.map.addLayer({
                id: 'pf-isochrone-points',
                type: 'circle',
                source: 'pf-isochrone-source',
                paint: {
                    'circle-radius': 1,
                    'circle-color': [
                        'hsl',
                        ['*', ['/', ['get', 'step'], 150], 360], // Hue: step/150 * 360 (full spectrum)
                        0.8,  // Saturation: 80%
                        0.5   // Lightness: 50%
                    ],
                    'circle-opacity': 0.8,  // High opacity as requested
                    'circle-stroke-width': 1,
                    'circle-stroke-color': [
                        'hsl',
                        ['*', ['/', ['get', 'step'], 150], 360], // Same hue as fill
                        0.6,  // Saturation: 60%
                        0.3   // Lightness: 30% (darker)
                    ],
                    'circle-stroke-opacity': 0.6
                }
            });
        }

        // Boat Position Marker (Dot)
        if (!this.map.getSource('pf-boat-pos-source')) {
            this.map.addSource('pf-boat-pos-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!this.map.getLayer('pf-boat-pos-dot')) {
            this.map.addLayer({
                id: 'pf-boat-pos-dot',
                type: 'circle',
                source: 'pf-boat-pos-source',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#000000',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });
        }
    }

    _removeMapLayers() {
        if (this.map.getLayer('pf-routing-line')) this.map.removeLayer('pf-routing-line');
        if (this.map.getLayer('pf-routing-bbox')) this.map.removeLayer('pf-routing-bbox');
        if (this.map.getLayer('pf-routing-bbox-outline')) this.map.removeLayer('pf-routing-bbox-outline');
        if (this.map.getSource('pf-routing-source')) this.map.removeSource('pf-routing-source');

        if (this.map.getLayer('pf-result-line')) this.map.removeLayer('pf-result-line');
        if (this.map.getSource('pf-result-source')) this.map.removeSource('pf-result-source');
        
        if (this.map.getLayer('pf-boat-pos-dot')) this.map.removeLayer('pf-boat-pos-dot');
        if (this.map.getSource('pf-boat-pos-source')) this.map.removeSource('pf-boat-pos-source');
    }

    _removeMarkers() {
        if (this.startMarker) this.startMarker.remove();
        if (this.endMarker) this.endMarker.remove();
        if (this.bboxMarkers.sw) this.bboxMarkers.sw.remove();
        if (this.bboxMarkers.ne) this.bboxMarkers.ne.remove();
        this.startMarker = null;
        this.endMarker = null;
        this.bboxMarkers = { sw: null, ne: null };
    }

    setStart(lngLat) {
        this.state.start = lngLat;
        this._updateUIInputs();
        this._updateMarkers();
        this._recalc();
        this._updateRunButtonState();
    }

    setEnd(lngLat) {
        this.state.end = lngLat;
        this._updateUIInputs();
        this._updateMarkers();
        this._recalc();
        this._updateRunButtonState();
    }

    clearAll() {
        this.state.start = null;
        this.state.end = null;
        this.state.bbox = null;
        this.routeData = null;
        this._updateUIInputs();
        this._removeMarkers();
        this._updateGeoJSON();
        
        // Clear result route
        const resultSource = this.map.getSource('pf-result-source');
        if (resultSource) {
            resultSource.setData({ type: 'FeatureCollection', features: [] });
        }
        
        // Clear boat pos
        const boatSource = this.map.getSource('pf-boat-pos-source');
        if (boatSource) {
            boatSource.setData({ type: 'FeatureCollection', features: [] });
        }

        this._updateRunButtonState();
        
        // Reset view
        if (this.formView) this.formView.style.display = 'flex';
        if (this.resultView) this.resultView.style.display = 'none';
    }

    _updateRunButtonState() {
        if (!this.runButton) return;
        const ready = this.state.start && this.state.end && this.state.bbox;
        this.runButton.disabled = !ready;
        if (ready) {
            this.runButton.classList.add('active');
        } else {
            this.runButton.classList.remove('active');
        }
    }

    _updateFromInputs() {
        const sLat = parseFloat(this.startInputLat.value);
        const sLon = parseFloat(this.startInputLon.value);
        const eLat = parseFloat(this.endInputLat.value);
        const eLon = parseFloat(this.endInputLon.value);

        let changed = false;
        if (!isNaN(sLat) && !isNaN(sLon)) {
            this.state.start = [sLon, sLat];
            changed = true;
        }
        if (!isNaN(eLat) && !isNaN(eLon)) {
            this.state.end = [eLon, eLat];
            changed = true;
        }

        if (changed) {
            this._updateMarkers();
            this._recalc();
        }
        this._updateRunButtonState();
    }

    _updateFromMarkers() {
        if (this.startMarker) {
            const lngLat = this.startMarker.getLngLat();
            this.state.start = [lngLat.lng, lngLat.lat];
        }
        if (this.endMarker) {
            const lngLat = this.endMarker.getLngLat();
            this.state.end = [lngLat.lng, lngLat.lat];
        }
        this._updateUIInputs();
        this._recalc();
        this._updateRunButtonState();
    }

    _updateMarkers() {
        // Start Marker
        if (this.state.start) {
            if (!this.startMarker) {
                const el = document.createElement('div');
                el.className = 'pf-routing-marker-start';
                el.style.backgroundColor = '#00ff00';
                el.style.width = '15px';
                el.style.height = '15px';
                el.style.borderRadius = '50%';
                el.style.border = '2px solid white';
                el.style.cursor = 'move';

                this.startMarker = new mapboxgl.Marker({ element: el, draggable: true })
                    .setLngLat(this.state.start)
                    .addTo(this.map)
                    .on('drag', this._updateFromMarkers)
                    .on('dragend', this._updateFromMarkers); // Ensure final snap
            } else {
                this.startMarker.setLngLat(this.state.start);
            }
        } else if (this.startMarker) {
            this.startMarker.remove();
            this.startMarker = null;
        }

        // End Marker
        if (this.state.end) {
            if (!this.endMarker) {
                const el = document.createElement('div');
                el.className = 'pf-routing-marker-end';
                el.style.backgroundColor = '#ff0000';
                el.style.width = '15px';
                el.style.height = '15px';
                el.style.borderRadius = '50%';
                el.style.border = '2px solid white';
                el.style.cursor = 'move';

                this.endMarker = new mapboxgl.Marker({ element: el, draggable: true })
                    .setLngLat(this.state.end)
                    .addTo(this.map)
                    .on('drag', this._updateFromMarkers)
                    .on('dragend', this._updateFromMarkers);
            } else {
                this.endMarker.setLngLat(this.state.end);
            }
        } else if (this.endMarker) {
            this.endMarker.remove();
            this.endMarker = null;
        }
    }

    _recalc() {
        if (this.state.start && this.state.end) {
            // 1. Reset BBox to default buffer if we just moved Start/End
            // Actually, the plan says: "Updating the Start/End points will reset the Bounding Box to the default"
            // So yes, recalculate bbox.
            this._calculateDefaultBBox();
            this._updateBBoxMarkers();
            this._updateGeoJSON();
            this._updateBBoxInputs();
        } else {
             // If we don't have both points, maybe just clear the bbox and line?
             // Or keep bbox if we have one? Plan implies we need both for the line.
             // Let's clear bbox if one point is missing to avoid confusion.
             this.state.bbox = null;
             this._updateBBoxMarkers();
             this._updateGeoJSON();
             this._updateBBoxInputs();
        }
    }

    _calculateDefaultBBox() {
        if (!this.state.start || !this.state.end) return;
        const [sLon, sLat] = this.state.start;
        const [eLon, eLat] = this.state.end;

        // Handle antimeridian? For simplicity, assume standard -180/180 for now, 
        // but if they cross 180 it might be tricky. 
        // Let's do simple min/max first.
        let minLon = Math.min(sLon, eLon);
        let maxLon = Math.max(sLon, eLon);
        let minLat = Math.min(sLat, eLat);
        let maxLat = Math.max(sLat, eLat);

        // Buffer +/- 2 deg
        const BUFFER = 2.0;
        minLon -= BUFFER;
        maxLon += BUFFER;
        minLat -= BUFFER;
        maxLat += BUFFER;

        // Clamp lat
        minLat = Math.max(-90, minLat);
        maxLat = Math.min(90, maxLat);
        
        // Normalize Lon? Mapbox handles >180 usually, but let's keep it simple.
        
        this.state.bbox = [minLon, minLat, maxLon, maxLat];
    }

    _updateBBoxFromInputs() {
        // User edited bbox inputs
        const minLat = parseFloat(this.bboxInputs.minLat.value);
        const maxLat = parseFloat(this.bboxInputs.maxLat.value);
        const minLon = parseFloat(this.bboxInputs.minLon.value);
        const maxLon = parseFloat(this.bboxInputs.maxLon.value);

        if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLon) && !isNaN(maxLon)) {
            this.state.bbox = [minLon, minLat, maxLon, maxLat];
            this._updateBBoxMarkers(); // Move corners to new coords
            this._updateGeoJSON();     // Redraw poly
            // Do NOT reset start/end or recalc default bbox here
        }
        this._updateRunButtonState();
    }

    _updateBBoxFromCorners() {
        // Dragged a corner
        if (this.bboxMarkers.sw && this.bboxMarkers.ne) {
            const sw = this.bboxMarkers.sw.getLngLat();
            const ne = this.bboxMarkers.ne.getLngLat();
            
            // We just take their current positions as the new bbox
            // We assume SW is min, NE is max, but user might invert them by dragging past each other.
            // Let's sort them.
            const minLon = Math.min(sw.lng, ne.lng);
            const maxLon = Math.max(sw.lng, ne.lng);
            const minLat = Math.min(sw.lat, ne.lat);
            const maxLat = Math.max(sw.lat, ne.lat);

            this.state.bbox = [minLon, minLat, maxLon, maxLat];
            this._updateBBoxInputs();
            this._updateGeoJSON();
        }
        this._updateRunButtonState();
    }

    _updateBBoxMarkers() {
        if (!this.state.bbox) {
            if (this.bboxMarkers.sw) { this.bboxMarkers.sw.remove(); this.bboxMarkers.sw = null; }
            if (this.bboxMarkers.ne) { this.bboxMarkers.ne.remove(); this.bboxMarkers.ne = null; }
            return;
        }

        const [minLon, minLat, maxLon, maxLat] = this.state.bbox;

        const createCorner = () => {
            const el = document.createElement('div');
            el.className = 'pf-routing-handle';
            return el;
        };

        // SW Corner
        if (!this.bboxMarkers.sw) {
            this.bboxMarkers.sw = new mapboxgl.Marker({ element: createCorner(), draggable: true })
                .setLngLat([minLon, minLat])
                .addTo(this.map)
                .on('drag', this._updateBBoxFromCorners);
        } else {
            this.bboxMarkers.sw.setLngLat([minLon, minLat]);
        }

        // NE Corner
        if (!this.bboxMarkers.ne) {
            this.bboxMarkers.ne = new mapboxgl.Marker({ element: createCorner(), draggable: true })
                .setLngLat([maxLon, maxLat])
                .addTo(this.map)
                .on('drag', this._updateBBoxFromCorners);
        } else {
            this.bboxMarkers.ne.setLngLat([maxLon, maxLat]);
        }
    }

    _updateUIInputs() {
        if (this.state.start) {
            this.startInputLat.value = this.state.start[1].toFixed(4);
            this.startInputLon.value = this.state.start[0].toFixed(4);
        } else {
            this.startInputLat.value = '';
            this.startInputLon.value = '';
        }

        if (this.state.end) {
            this.endInputLat.value = this.state.end[1].toFixed(4);
            this.endInputLon.value = this.state.end[0].toFixed(4);
        } else {
            this.endInputLat.value = '';
            this.endInputLon.value = '';
        }
    }

    _updateBBoxInputs() {
        if (this.state.bbox) {
            const [minLon, minLat, maxLon, maxLat] = this.state.bbox;
            this.bboxInputs.minLat.value = minLat.toFixed(4);
            this.bboxInputs.maxLat.value = maxLat.toFixed(4);
            this.bboxInputs.minLon.value = minLon.toFixed(4);
            this.bboxInputs.maxLon.value = maxLon.toFixed(4);
        } else {
            this.bboxInputs.minLat.value = '';
            this.bboxInputs.maxLat.value = '';
            this.bboxInputs.minLon.value = '';
            this.bboxInputs.maxLon.value = '';
        }
    }

    _updateGeoJSON() {
        const features = [];
        
        // 1. Great Circle Line
        if (this.state.start && this.state.end) {
            const coords = this._getGreatCircleCoords(this.state.start, this.state.end);
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coords
                }
            });
        }

        // 2. BBox Polygon
        if (this.state.bbox) {
            const [minLon, minLat, maxLon, maxLat] = this.state.bbox;
            // CCW winding
            const polyCoords = [
                [
                    [minLon, minLat],
                    [maxLon, minLat],
                    [maxLon, maxLat],
                    [minLon, maxLat],
                    [minLon, minLat]
                ]
            ];
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: polyCoords
                }
            });
        }

        const source = this.map.getSource('pf-routing-source');
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: features
            });
        }
    }

    // --- API ---

    async _runRoute() {
        if (!this.state.start || !this.state.end || !this.state.bbox) {
            console.warn("Missing route parameters");
            alert("Please set Start, End, and ensure BBox is valid.");
            return;
        }

        const url = "https://peterm790--weather-routing-get-route.modal.run";
        
        const params = new URLSearchParams({
            start_lat: this.state.start[1],
            start_lon: this.state.start[0],
            end_lat: this.state.end[1],
            end_lon: this.state.end[0],
            min_lat: this.state.bbox[1],
            min_lon: this.state.bbox[0],
            max_lat: this.state.bbox[3],
            max_lon: this.state.bbox[2],
            init_time: this.state.initTimeIndex,
            lead_time_start: this.state.leadTimeStart,
            freq: this.state.frequency,
            polar_file: this.state.polar_file
        });

        // Clear existing isochrone points for new route calculation
        this.isochronePoints = [];
        const isochroneSource = this.map.getSource('pf-isochrone-source');
        if (isochroneSource) {
            isochroneSource.setData({ type: 'FeatureCollection', features: [] });
        }

        // Show loading state
        this.loadingOverlay.show(1);
        if (this.loadingOverlay.progressEl) {
            this.loadingOverlay.progressEl.textContent = "Starting Routing...";
            
            // Append Cancel button if not exists
            if (!this.loadingOverlay.root.querySelector('.pf-loading-cancel')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'pf-loading-cancel pf-routing-button';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.style.marginTop = '10px';
                cancelBtn.style.width = 'auto';
                cancelBtn.style.padding = '4px 12px';
                cancelBtn.style.fontSize = '12px';
                cancelBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (this.abortController) {
                        this.abortController.abort();
                        this.abortController = null;
                    }
                };
                this.loadingOverlay.progressEl.parentNode.appendChild(cancelBtn);
            }
        }

        this.abortController = new AbortController();
        this._hasReceivedInitial = false;

        try {
            const response = await fetch(url + "?" + params.toString(), { 
                method: 'GET',
                signal: this.abortController.signal 
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                // Keep the last partial line in the buffer
                buffer = lines.pop(); 

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const msg = JSON.parse(line);
                        this._handleRouteMessage(msg);
                    } catch (e) {
                        console.error('JSON parse error:', e);
                    }
                }
            }
            
            // Process any remaining buffer
            if (buffer.trim()) {
                try {
                    const msg = JSON.parse(buffer);
                    this._handleRouteMessage(msg);
                } catch (e) {
                    console.error('Final JSON parse error:', e);
                }
            }

            this.abortController = null;

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Route calculation cancelled');
            } else {
                console.error("Route API Failed:", err);
                alert("Routing failed: " + err.message);
            }
        } finally {
            this.loadingOverlay.hide();
            const btn = this.loadingOverlay.root.querySelector('.pf-loading-cancel');
            if (btn) btn.remove();
        }
    }

    _handleRouteMessage(msg) {
        if (msg.type === 'progress') {
            // Format: "Step: 5 | Dist: 120.5 nm" -> "Step 5 - 120 nm to go"
            const step = msg.step !== undefined ? `Step ${msg.step}` : '';
            const dist = msg.dist !== undefined ? `${Math.round(parseFloat(msg.dist))} nm to go` : '';
            const sep = (step && dist) ? ' - ' : '';
            const prefix = this._hasReceivedInitial ? "Optimising..." : "Calculating...";
            const text = `${prefix} ${step}${sep}${dist}`;
            this.loadingOverlay.progressEl.textContent = text;

            // Draw isochrone points if available
            if (msg.isochrones && Array.isArray(msg.isochrones)) {
                this._drawIsochrones(msg.isochrones, msg.step);
            }
        } else if (msg.type === 'initial') {
            this._hasReceivedInitial = true;
            this.loadingOverlay.progressEl.textContent = "Optimising...";

            // Clear accumulated isochrone points when initial route is found
            this.isochronePoints = [];
            const isochroneSource = this.map.getSource('pf-isochrone-source');
            if (isochroneSource) {
                isochroneSource.setData({ type: 'FeatureCollection', features: [] });
            }

            this._drawRoute(msg.data, true); // true = isInitial
        } else if (msg.type === 'result') {
            this._drawRoute(msg.data, false); // false = final result
        }
    }

    _drawRoute(data, isInitial = false) {
        // Process and draw route
        // Data can be [[lat, lon], ...] (initial) or [{lat, lon, ...}, ...] (result)
        
        let pointsArray = data;
        // Validate array
        if (!Array.isArray(pointsArray)) {
             console.warn("Received invalid route data", data);
             return;
        }

        if (pointsArray.length > 0) {
            
            if (!isInitial) {
                this.routeData = pointsArray; // Store FINAL route for time slider sync
            }
            
            // Extract coordinates: [lon, lat]
            const routeCoords = pointsArray.map(p => {
                let lat, lon;
                if (Array.isArray(p)) {
                    // Initial route comes as [lat, lon] arrays
                    lat = p[0];
                    lon = p[1];
                } else {
                    // Final route comes as objects with lat/lon properties
                    lat = p.lat;
                    lon = p.lon;
                }
                return [lon, lat];
            });
            
            // Validate coords
            const validCoords = routeCoords.filter(c => !isNaN(c[0]) && !isNaN(c[1]));
            
            if (validCoords.length === 0) {
                console.warn("Received route data but found no valid coordinates", pointsArray[0]);
                return;
            }

            // Choose source based on type
            const sourceId = isInitial ? 'pf-initial-route-source' : 'pf-result-source';
            const resultSource = this.map.getSource(sourceId);
            
            if (resultSource) {
                resultSource.setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: validCoords
                        },
                        properties: {}
                    }]
                });
            }
            
            // Only switch view and notify app if it's the final route
            if (!isInitial) {
                // Switch to result view
                this.formView.style.display = 'none';
                this.resultView.style.display = 'flex';
                
                // Clear the initial route line so only final remains
                const initialSource = this.map.getSource('pf-initial-route-source');
                if (initialSource) {
                    initialSource.setData({ type: 'FeatureCollection', features: [] });
                }

                // Notify app to jump time slider to start
                if (this.onRouteLoadedHandler) {
                    this.onRouteLoadedHandler(this.state.leadTimeStart);
                }
            }
        } else {
            console.warn("Received empty route data");
        }
    }

    _drawIsochrones(isochronePoints, step) {
        // Draw isochrone points on the map
        // isochronePoints should be an array of [lat, lon] arrays

        if (!Array.isArray(isochronePoints) || isochronePoints.length === 0) {
            return;
        }

        // Accumulate the new points with step information
        const pointsWithStep = isochronePoints.map(point => ({
            lat: point[0],
            lon: point[1],
            step: step || 0
        }));
        this.isochronePoints.push(...pointsWithStep);

        // Create point features with step-based properties
        const features = this.isochronePoints
            .filter(point => !isNaN(point.lat) && !isNaN(point.lon))
            .map(point => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [point.lon, point.lat] // [lon, lat]
                },
                properties: {
                    step: point.step
                }
            }));

        const isochroneSource = this.map.getSource('pf-isochrone-source');
        if (isochroneSource) {
            isochroneSource.setData({
                type: 'FeatureCollection',
                features: features
            });
        }
    }

    // --- Math Helpers ---

    _getGreatCircleCoords(start, end, numPoints = 100) {
        
        const toRad = (d) => d * Math.PI / 180;
        const toDeg = (r) => r * 180 / Math.PI;

        const lon1 = toRad(start[0]), lat1 = toRad(start[1]);
        const lon2 = toRad(end[0]), lat2 = toRad(end[1]);

        const d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)));

        const coords = [];
        for (let i = 0; i <= numPoints; i++) {
            const f = i / numPoints;
            const A = Math.sin((1 - f) * d) / Math.sin(d);
            const B = Math.sin(f * d) / Math.sin(d);
            const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
            const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
            const z = A * Math.sin(lat1) + B * Math.sin(lat2);
            const phi = Math.atan2(z, Math.sqrt(x * x + y * y));
            const lam = Math.atan2(y, x);
            coords.push([toDeg(lam), toDeg(phi)]);
        }
        return coords;
    }

    // Called when the main time slider changes
    setCurrentTime(isoTime) {
        if (!this.routeData || !this.routeData.length) return;

        // Find point with closest timestamp
        const targetTime = new Date(isoTime).getTime();
        let closestPoint = null;
        let minDiff = Infinity;

        for (const point of this.routeData) {
            // Ensure UTC parsing. Replace space with T and append Z if missing.
            if (!point.time) continue;
            
            let timeStr = String(point.time).replace(' ', 'T');
            if (!timeStr.endsWith('Z') && !timeStr.includes('+')) timeStr += 'Z';
            
            const ptTime = new Date(timeStr).getTime();
            const diff = Math.abs(ptTime - targetTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestPoint = point;
            }
        }
        
        // Update boat position marker
        if (closestPoint) {
            const source = this.map.getSource('pf-boat-pos-source');
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [closestPoint.lon, closestPoint.lat]
                        },
                        properties: {
                            time: closestPoint.time,
                            speed: closestPoint.boat_speed
                        }
                    }]
                });
            }
            
            // Update result table if visible
            if (this.resultView && this.resultView.style.display !== 'none') {
                const setText = (id, txt) => {
                    const el = document.getElementById(`pf-route-val-${id}`);
                    if (el) el.textContent = txt;
                };
                
                // Time
                let timeStr = closestPoint.time;
                // Parse for nice display respecting showLocalTime
                const d = new Date(timeStr.endsWith('Z') ? timeStr : timeStr.replace(' ', 'T') + 'Z');
                if (this.showLocalTime) {
                    timeStr = formatLocal(d);
                } else {
                    timeStr = formatUTC(d);
                }
                setText('time', timeStr);
                
                // Pos
                const lat = closestPoint.lat.toFixed(4);
                const lon = closestPoint.lon.toFixed(4);
                setText('pos', `${lat}, ${lon}`);
                
                // Values
                if (closestPoint.tws !== undefined) setText('tws', `${closestPoint.tws.toFixed(1)} kn`);
                if (closestPoint.twd !== undefined) setText('twd', `${Math.round(closestPoint.twd)}°`);
                if (closestPoint.twa !== undefined) setText('twa', `${Math.round(closestPoint.twa)}°`);
                if (closestPoint.heading !== undefined) setText('hdg', `${Math.round(closestPoint.heading)}°`);
                if (closestPoint.boat_speed !== undefined) setText('spd', `${closestPoint.boat_speed.toFixed(1)} kn`);
            }
        }
    }
}

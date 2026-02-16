import './polar.css';

function parsePol(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('Invalid .pol file: expected header plus data rows.');
  }

  const header = lines[0].split(/\s+/);
  const tws = header.slice(1).map(Number).filter(Number.isFinite);

  const rows = lines
    .slice(1)
    .map((line) => {
      const values = line.split(/\s+/).map(Number);
      return { twa: values[0], speeds: values.slice(1, 1 + tws.length) };
    })
    .filter((row) => Number.isFinite(row.twa));

  return { tws, rows };
}

function findBracket(values, target) {
  if (target <= values[0]) return [0, 0];
  if (target >= values[values.length - 1]) return [values.length - 1, values.length - 1];
  for (let i = 0; i < values.length - 1; i += 1) {
    if (target >= values[i] && target <= values[i + 1]) return [i, i + 1];
  }
  return [values.length - 1, values.length - 1];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolateSpeed(data, twaInput, twsInput) {
  const twas = data.rows.map((r) => r.twa);
  const twss = data.tws;
  const twa = Math.max(twas[0], Math.min(twaInput, twas[twas.length - 1]));
  const tws = Math.max(twss[0], Math.min(twsInput, twss[twss.length - 1]));

  const [twaLo, twaHi] = findBracket(twas, twa);
  const [twsLo, twsHi] = findBracket(twss, tws);

  const q11 = data.rows[twaLo].speeds[twsLo] || 0;
  const q21 = data.rows[twaHi].speeds[twsLo] || 0;
  const q12 = data.rows[twaLo].speeds[twsHi] || 0;
  const q22 = data.rows[twaHi].speeds[twsHi] || 0;

  const twa1 = twas[twaLo];
  const twa2 = twas[twaHi];
  const tws1 = twss[twsLo];
  const tws2 = twss[twsHi];

  if (twa1 === twa2 && tws1 === tws2) return q11;
  if (twa1 === twa2) return lerp(q11, q12, (tws - tws1) / (tws2 - tws1));
  if (tws1 === tws2) return lerp(q11, q21, (twa - twa1) / (twa2 - twa1));

  const r1 = lerp(q11, q21, (twa - twa1) / (twa2 - twa1));
  const r2 = lerp(q12, q22, (twa - twa1) / (twa2 - twa1));
  return lerp(r1, r2, (tws - tws1) / (tws2 - tws1));
}

const ORC_COLOR_STOPS = [
  [0, '#8c564b'],
  [4, '#8c564b'],
  [6, '#1f77b4'],
  [8, '#ff7f0e'],
  [10, '#2ca02c'],
  [12, '#d62728'],
  [14, '#9467bd'],
  [16, '#17becf'],
  [20, '#e377c2'],
  [24, '#777777'],
  [30, '#5a5a5a']
];

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const int = Number.parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColor(c1, c2, t) {
  return {
    r: lerp(c1.r, c2.r, t),
    g: lerp(c1.g, c2.g, t),
    b: lerp(c1.b, c2.b, t)
  };
}

function speedToColor(tws) {
  if (!Number.isFinite(tws)) return '#777777';
  return ORC_COLOR_STOPS[ORC_COLOR_STOPS.length - 1][1];
}

function speedToColorNormalized(tws, maxTws) {
  if (!Number.isFinite(tws) || !Number.isFinite(maxTws) || maxTws <= 0) {
    return speedToColor(tws);
  }
  const normalized = Math.max(0, Math.min(1, tws / maxTws)) * 30;
  for (let i = 0; i < ORC_COLOR_STOPS.length - 1; i += 1) {
    const [x1, c1Hex] = ORC_COLOR_STOPS[i];
    const [x2, c2Hex] = ORC_COLOR_STOPS[i + 1];
    if (normalized >= x1 && normalized <= x2) {
      const t = x2 === x1 ? 0 : (normalized - x1) / (x2 - x1);
      return rgbToHex(mixColor(hexToRgb(c1Hex), hexToRgb(c2Hex), t));
    }
  }
  return ORC_COLOR_STOPS[ORC_COLOR_STOPS.length - 1][1];
}

function samplePaletteAtFraction(palette, fraction) {
  if (!Array.isArray(palette) || palette.length === 0) return null;
  const t = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  if (palette.length === 1) return palette[0]?.[1] || null;
  const idx = Math.round(t * (palette.length - 1));
  return palette[idx]?.[1] || null;
}

function polarToXY(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function buildPath(rows, twsIndex, cx, cy, radius, maxSpeed) {
  const points = rows
    .map((row) => {
      const speed = row.speeds[twsIndex] || 0;
      if (speed <= 0) return null;
      const r = (speed / maxSpeed) * radius;
      const angle = row.twa;
      return polarToXY(cx, cy, r, angle);
    })
    .filter(Boolean);

  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

function drawPolar(svg, legend, data, maxPlotTws, markers = {}, mapPalette = null) {
  const canvasWrap = svg.closest('.polar-canvas-wrap');
  const wrapRect = canvasWrap ? canvasWrap.getBoundingClientRect() : svg.getBoundingClientRect();
  const height = Math.max(420, Math.floor(wrapRect.height || 620));
  const cx = 18;
  const cy = Math.floor(height / 2);
  const radius = Math.max(80, Math.min(cy - 24, height - cy - 24));
  const angleGuides = [0, 45, 52, 60, 75, 90, 110, 120, 135, 150, 165];
  const rightMostLabelX = Math.max(...angleGuides.map((angle) => polarToXY(cx, cy, radius + 16, angle).x));
  const baseWidth = rightMostLabelX + 22; // small fixed safety for label text width
  const breathingRoom = Math.max(6, Math.floor(baseWidth * 0.02)); // ~2% white space
  const width = Math.max(320, Math.floor(baseWidth + breathingRoom));

  const twsLimit = Number.isFinite(maxPlotTws) ? Math.max(0, Math.min(60, maxPlotTws)) : 30;
  const visibleTws = data.tws
    .map((tws, i) => ({ tws, i }))
    .filter((entry) => entry.tws <= twsLimit);

  const maxSpeed = Math.max(
    10,
    ...data.rows.flatMap((r) => visibleTws.map((entry) => r.speeds[entry.i])).filter(Number.isFinite)
  );

  const sogRings = [];
  for (let value = 2; value <= Math.floor(maxSpeed); value += 2) {
    sogRings.push(value);
  }
  if (sogRings[sogRings.length - 1] !== Math.floor(maxSpeed)) {
    sogRings.push(Math.floor(maxSpeed));
  }
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
  svg.innerHTML = '';
  legend.innerHTML = '';
  if (canvasWrap) {
    canvasWrap.style.setProperty('--plot-width', `${width}px`);
    const widget = svg.closest('.polar-widget');
    if (widget) {
      widget.style.setProperty('--plot-width', `${width}px`);
    }
  }

  const ns = 'http://www.w3.org/2000/svg';

  sogRings.forEach((sog) => {
    const g = document.createElementNS(ns, 'g');
    const isMajor = sog % 10 === 0;
    g.setAttribute('class', `axis speed-ring ${isMajor ? 'major-ring' : 'minor-ring'} sog-${sog}`);

    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', ((sog / maxSpeed) * radius).toFixed(2));
    g.appendChild(c);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', cx);
    label.setAttribute('y', (cy - (sog / maxSpeed) * radius - 4).toFixed(2));
    label.setAttribute('transform', `rotate(25 ${cx} ${cy})`);
    label.setAttribute('class', `speed-ring-label ${isMajor ? 'major' : 'minor'}`);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', 'var(--polar-muted)');
    label.setAttribute('font-size', isMajor ? '11' : '10');
    label.textContent = `${sog} kts`;
    g.appendChild(label);

    svg.appendChild(g);
  });

  angleGuides.forEach((angle) => {
    const p = polarToXY(cx, cy, radius, angle);
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('class', 'axis');
    line.setAttribute('x1', cx);
    line.setAttribute('y1', cy);
    line.setAttribute('x2', p.x);
    line.setAttribute('y2', p.y);
    line.setAttribute('stroke', 'var(--polar-grid)');
    line.setAttribute('stroke-dasharray', '1,4');
    svg.appendChild(line);

    const labelPoint = polarToXY(cx, cy, radius + 16, angle);
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', labelPoint.x);
    label.setAttribute('y', labelPoint.y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.setAttribute('fill', 'var(--polar-muted)');
    label.setAttribute('font-size', '11');
    label.textContent = `${angle} deg`;
    svg.appendChild(label);
  });

  const twsToColor = (tws) => {
    if (Array.isArray(mapPalette) && mapPalette.length > 0) {
      const frac = twsLimit > 0 ? tws / twsLimit : 0;
      const fromMap = samplePaletteAtFraction(mapPalette, frac);
      if (fromMap) return fromMap;
    }
    return speedToColorNormalized(tws, twsLimit);
  };

  visibleTws.forEach(({ tws, i }) => {
    const color = twsToColor(tws);

    const sb = document.createElementNS(ns, 'path');
    sb.setAttribute('class', `line tws-${Math.round(tws)}`);
    sb.setAttribute('d', buildPath(data.rows, i, cx, cy, radius, maxSpeed));
    sb.setAttribute('stroke', color);
    svg.appendChild(sb);

    const li = document.createElement('li');
    const sw = document.createElement('span');
    sw.className = 'legend-swatch';
    sw.style.background = color;

    const tx = document.createElement('span');
    tx.textContent = `${tws.toFixed(0)} kn`;

    li.append(sw, tx);
    legend.appendChild(li);
  });

  const drawMarker = (marker, className, dotRadius) => {
    if (!marker || !Number.isFinite(marker.twa) || !Number.isFinite(marker.speed) || marker.speed < 0) return;
    const r = (marker.speed / maxSpeed) * radius;
    const p = polarToXY(cx, cy, r, marker.twa);
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('class', className);
    dot.setAttribute('cx', p.x.toFixed(2));
    dot.setAttribute('cy', p.y.toFixed(2));
    dot.setAttribute('r', String(dotRadius));
    if (className === 'route-marker' && Number.isFinite(marker.tws)) {
      dot.style.fill = twsToColor(marker.tws);
    }
    svg.appendChild(dot);
  };

  drawMarker(markers.calc, 'calc-marker', 4.8);
  drawMarker(markers.route, 'route-marker', 5.2);
}

function mount(host, { title = 'volvo70.pol', standalone = false, showClose = false } = {}) {
  if (!host) throw new Error('Missing mount host');

  if (standalone) {
    document.body.style.overflow = 'auto';
    host.className = 'polar-app';
  }

  host.innerHTML = `
    <main class="polar-stage ${standalone ? 'polar-stage-standalone' : 'polar-stage-overlay'}">
      <section class="polar-widget" id="polarWidget">
        <header class="polar-widget-head" id="polarDragHandle">
          <h1>${title}</h1>
          ${showClose ? '<button class="polar-close-btn" id="polarCloseBtn" aria-label="Close polar">x</button>' : ''}
        </header>
        <div class="polar-widget-body">
          <div class="polar-canvas-wrap">
            <svg id="polarPlot" aria-label="Polar plot" role="img"></svg>
          </div>
          <aside class="polar-side">
            <section class="polar-card polar-calc-card">
              <div class="polar-func-title">BSP = f(TWA, TWS)</div>
              <div class="polar-func-inputs">
                <label>
                  TWA
                  <input id="polarTwaInput" type="number" min="0" max="180" step="0.1" value="90" />
                </label>
                <label>
                  TWS
                  <input id="polarTwsInput" type="number" min="0" max="60" step="0.1" value="20" />
                </label>
              </div>
              <div class="polar-func-result">
                BSP = <strong id="polarSpeedOutput">-</strong>
              </div>
            </section>
            <section class="polar-card polar-legend">
              <h2>TWS (kn)</h2>
              <ul id="polarLegend"></ul>
            </section>
            <section class="polar-card polar-max-card">
              <label>
                Max TWS (plot)
                <input id="polarMaxTwsInput" type="number" min="0" max="60" step="0.1" value="30" />
              </label>
            </section>
          </aside>
        </div>
      </section>
    </main>
  `;

  return {
    host,
    widget: host.querySelector('#polarWidget'),
    dragHandle: host.querySelector('#polarDragHandle'),
    closeBtn: host.querySelector('#polarCloseBtn'),
    svg: host.querySelector('#polarPlot'),
    legend: host.querySelector('#polarLegend'),
    panel: host.querySelector('.polar-canvas-wrap'),
    twaInput: host.querySelector('#polarTwaInput'),
    twsInput: host.querySelector('#polarTwsInput'),
    maxTwsInput: host.querySelector('#polarMaxTwsInput'),
    speedOutput: host.querySelector('#polarSpeedOutput')
  };
}

function initFloatingWidget(widget, dragHandle, onChange, placement = 'center') {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const center = () => {
    const left = Math.max(8, (window.innerWidth - widget.offsetWidth) / 2);
    const top = Math.max(8, (window.innerHeight - widget.offsetHeight) / 2);
    widget.style.left = `${Math.round(left)}px`;
    widget.style.top = `${Math.round(top)}px`;
  };
  const topRight = () => {
    const margin = 16;
    const left = Math.max(8, window.innerWidth - widget.offsetWidth - margin);
    widget.style.left = `${Math.round(left)}px`;
    widget.style.top = `${margin}px`;
  };

  requestAnimationFrame(() => {
    if (placement === 'top-right') topRight();
    else center();
  });

  let drag = null;
  dragHandle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = {
      startX: event.clientX,
      startY: event.clientY,
      startLeft: widget.offsetLeft,
      startTop: widget.offsetTop
    };
    dragHandle.setPointerCapture(event.pointerId);
  });

  dragHandle.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const nextLeft = drag.startLeft + (event.clientX - drag.startX);
    const nextTop = drag.startTop + (event.clientY - drag.startY);
    const maxLeft = window.innerWidth - widget.offsetWidth - 8;
    const maxTop = window.innerHeight - widget.offsetHeight - 8;
    widget.style.left = `${Math.round(clamp(nextLeft, 8, Math.max(8, maxLeft)))}px`;
    widget.style.top = `${Math.round(clamp(nextTop, 8, Math.max(8, maxTop)))}px`;
  });

  const stopDrag = () => { drag = null; };
  dragHandle.addEventListener('pointerup', stopDrag);
  dragHandle.addEventListener('pointercancel', stopDrag);

  const resizeObserver = new ResizeObserver(() => onChange());
  resizeObserver.observe(widget);

  const handleWindowResize = () => {
    const maxLeft = window.innerWidth - widget.offsetWidth - 8;
    const maxTop = window.innerHeight - widget.offsetHeight - 8;
    widget.style.left = `${Math.round(clamp(widget.offsetLeft, 8, Math.max(8, maxLeft)))}px`;
    widget.style.top = `${Math.round(clamp(widget.offsetTop, 8, Math.max(8, maxTop)))}px`;
    onChange();
  };
  window.addEventListener('resize', handleWindowResize);

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', handleWindowResize);
  };
}

export async function mountPolarWidget({
  host,
  title = 'volvo70.pol',
  polarFile = '/volvo70.pol',
  standalone = false,
  showClose = false,
  onClose = null,
  placement = 'center'
} = {}) {
  const mountHost = host || document.getElementById('map');
  if (!mountHost) throw new Error('No host available to mount polar widget');

  const {
    host: mountedHost,
    widget,
    dragHandle,
    closeBtn,
    svg,
    legend,
    panel,
    twaInput,
    twsInput,
    maxTwsInput,
    speedOutput
  } = mount(mountHost, { title, standalone, showClose });
  const response = await fetch(polarFile);
  if (!response.ok) {
    throw new Error(`Unable to load ${polarFile} (${response.status})`);
  }

  const text = await response.text();
  const data = parsePol(text);
  let currentCalcMarker = null;
  let currentRouteMarker = null;
  let currentMapPalette = null;
  const twas = data.rows.map((r) => r.twa);
  const twss = data.tws;

  const clampMarker = (markerInput, allowInterpolateSpeed = true) => {
    if (!markerInput) return null;
    const twaInputRaw = Number.parseFloat(markerInput.twa);
    const twsRaw = Number.parseFloat(markerInput.tws);
    if (!Number.isFinite(twaInputRaw) || !Number.isFinite(twsRaw)) return null;
    const twaRaw = Math.abs(twaInputRaw);
    const twa = Math.max(twas[0], Math.min(twaRaw, twas[twas.length - 1]));
    const tws = Math.max(twss[0], Math.min(twsRaw, twss[twss.length - 1]));
    const speedRaw = Number.parseFloat(markerInput.speed);
    const speed = Number.isFinite(speedRaw)
      ? speedRaw
      : (allowInterpolateSpeed ? interpolateSpeed(data, twa, tws) : NaN);
    if (!Number.isFinite(speed) || speed < 0) return null;
    return { twa, tws, speed };
  };

  const getClampedMaxPlotTws = () => {
    const raw = Number.parseFloat(maxTwsInput.value);
    if (!Number.isFinite(raw)) return 30;
    const clamped = Math.max(0, Math.min(60, raw));
    if (clamped !== raw) maxTwsInput.value = clamped.toString();
    return clamped;
  };

  const updatePlot = () => {
    drawPolar(svg, legend, data, getClampedMaxPlotTws(), {
      calc: currentCalcMarker,
      route: currentRouteMarker
    }, currentMapPalette);
  };
  updatePlot();

  const updateSpeed = () => {
    const marker = clampMarker({ twa: twaInput.value, tws: twsInput.value }, true);
    if (!marker) {
      speedOutput.textContent = '-';
      currentCalcMarker = null;
      updatePlot();
      return;
    }
    if (Number.parseFloat(twaInput.value) !== marker.twa) twaInput.value = marker.twa.toString();
    if (Number.parseFloat(twsInput.value) !== marker.tws) twsInput.value = marker.tws.toString();
    speedOutput.textContent = `${marker.speed.toFixed(2)} kn`;
    currentCalcMarker = marker;
    updatePlot();
  };

  const syncCalculatorToMarker = (marker) => {
    if (!marker) return;
    twaInput.value = marker.twa.toFixed(1);
    twsInput.value = marker.tws.toFixed(1);
    speedOutput.textContent = `${marker.speed.toFixed(2)} kn`;
    currentCalcMarker = marker;
  };

  twaInput.addEventListener('input', updateSpeed);
  twsInput.addEventListener('input', updateSpeed);
  maxTwsInput.addEventListener('input', updatePlot);
  updateSpeed();

  const cleanupFloating = initFloatingWidget(widget, dragHandle, updatePlot, placement);

  if (closeBtn && typeof onClose === 'function') {
    closeBtn.addEventListener('click', () => onClose());
  }

  return {
    destroy() {
      cleanupFloating();
      mountedHost.innerHTML = '';
    },
    setVisible(visible) {
      mountedHost.style.display = visible ? '' : 'none';
    },
    setRouteMarker(markerInput) {
      currentRouteMarker = clampMarker(markerInput, true);
      if (currentRouteMarker) {
        // Keep calculator aligned to route point so the route marker visually dominates;
        // manual calculator edits can still move the red marker away afterward.
        syncCalculatorToMarker(currentRouteMarker);
      }
      updatePlot();
    },
    setMapPalette(palette) {
      currentMapPalette = Array.isArray(palette) ? palette : null;
      updatePlot();
    },
    widget,
    root: mountedHost,
    panel
  };
}

if (typeof window !== 'undefined' && window.location.pathname.startsWith('/polars')) {
  mountPolarWidget({
    standalone: true,
    title: 'volvo70.pol',
    polarFile: '/volvo70.pol',
    showClose: false,
    placement: 'center'
  }).catch((error) => {
    const root = document.getElementById('map');
    if (root) {
      root.textContent = `Failed to load polar file: ${error.message}`;
    }
  });
}

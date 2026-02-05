# Petes Forecast Tech Debt To-Do

1. [x] Deduplicate init-time loading with a shared cache/module used by both the menu and app startup.
2. [x] Lazy-load noncritical UI/features (routing, tour, auth) after first paint or on user action.
3. [ ] Add persistent caching for forecast frames (IndexedDB with TTL, keyed by init time + variable + lead).
4. [x] Offload NPY decoding to a Web Worker (byte conversion still on main thread).
5. [ ] Memoize CPT colormap parsing to avoid repeated work.
6. [x] Remove unused dependencies (e.g., `geotiff`) and verify bundle impact.
7. [ ] Split `src/index.js` into focused modules (`map/`, `data/`, `ui/`, `render/`) to reduce coupling and clarify ownership.

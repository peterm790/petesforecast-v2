// Lightweight legend manager with lazy import of weatherlayers-gl

export function createLegendManager({ isMenuOpen }) {
    let control = null;
    let openHost = null;
    let closedHost = null;
    let currentHost = null;

    async function ensureControl() {
        if (control) return control;
        const mod = await import('weatherlayers-gl');
        const LegendControl = mod.LegendControl;
        control = new LegendControl();
        return control;
    }

    function ensureHosts() {
        if (!openHost || !closedHost) {
            const container = document.querySelector('.pf-menubar-container');
            if (!container) return;
            const sidebar = container.querySelector('.pf-menubar-sidebar');
            const openBtn = container.querySelector('.pf-menubar-open');
            if (!openHost && sidebar) {
                openHost = document.createElement('div');
                openHost.className = 'pf-menubar-legend-host pf-menubar-legend-open-host';
                sidebar.appendChild(openHost);
            }
            if (!closedHost && openBtn && openBtn.parentElement) {
                closedHost = document.createElement('div');
                closedHost.className = 'pf-menubar-legend-host pf-menubar-legend-closed-host';
                openBtn.insertAdjacentElement('afterend', closedHost);
            }
        }
    }

    async function position() {
        ensureHosts();
        const ctrl = await ensureControl();
        
        // User requested to hide legend when menu is hidden
        if (!isMenuOpen()) {
            try { ctrl.remove(); } catch {}
            currentHost = null;
            return;
        }

        const host = openHost;
        if (!host) return;
        if (currentHost === host) return;
        try { ctrl.remove(); } catch {}
        ctrl.addTo(host);
        currentHost = host;
        if (openHost) openHost.style.display = '';
        if (closedHost) closedHost.style.display = 'none';
    }

    async function updateConfig(cfg) {
        ensureHosts();
        const ctrl = await ensureControl();
        if (ctrl && ctrl.updateConfig) ctrl.updateConfig(cfg);
        await position();
    }

    return { updateConfig, position };
}



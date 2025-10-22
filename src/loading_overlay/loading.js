export class LoadingOverlay {
    constructor() {
        this.root = null;
        this.progressEl = null;
        this.total = 0;
        this.done = 0;
    }

    mount(host = document.body) {
        if (this.root) return;
        const overlay = document.createElement('div');
        overlay.className = 'pf-loading-overlay';

        const box = document.createElement('div');
        box.className = 'pf-loading-box';

        const spinner = document.createElement('div');
        spinner.className = 'pf-loading-spinner';

        const text = document.createElement('div');
        text.className = 'pf-loading-text';
        text.textContent = '';

        box.appendChild(spinner);
        box.appendChild(text);
        overlay.appendChild(box);
        host.appendChild(overlay);

        this.root = overlay;
        this.progressEl = text;
        this.hide();
    }

    show(total) {
        this.total = total || 0;
        this.done = 0;
        if (!this.root) this.mount();
        if (this.root) {
            this.root.style.display = 'flex';
            // force reflow to ensure paint before heavy work
            // eslint-disable-next-line no-unused-expressions
            this.root.offsetHeight;
            this.root.setAttribute('aria-busy', 'true');
            this.root.setAttribute('aria-modal', 'true');
        }
        this._render();
    }

    tick(done) {
        this.done = typeof done === 'number' ? done : this.done + 1;
        this._render();
    }

    hide() {
        if (this.root) {
            this.root.style.display = 'none';
            this.root.removeAttribute('aria-busy');
            this.root.removeAttribute('aria-modal');
        }
    }

    _render() {
        if (this.progressEl) {
            const total = this.total;
            const done = Math.min(this.done, total);
            this.progressEl.textContent = `${done}/${total}`;
        }
    }
}



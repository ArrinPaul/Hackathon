/**
 * App Controller - Main application logic
 */

class App {
    constructor() {
        this.currentSection = 'chat';
        this.sectionSlugs = {
            chat: 'chat',
            flashcards: 'flashcards',
            quiz: 'quiz',
            smart: 'smart-tools'
        };
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupRouting();
        this.updateApiStatus();
        this.syncFromHash();
        window.addEventListener('hashchange', () => this.syncFromHash());
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateTo(section, true);
            });
        });
    }

    setupRouting() {
        if (!window.location.hash) {
            this.updateHash(this.currentSection);
        }
    }

    syncFromHash() {
        const hash = window.location.hash.replace(/^#/, '');
        if (!hash) return;

        const [sectionSlug, toolSlug] = hash.split('/');
        const section = Object.keys(this.sectionSlugs).find(key => this.sectionSlugs[key] === sectionSlug);

        if (section) {
            this.navigateTo(section, false);
        }

        if (section === 'smart' && toolSlug && typeof openToolModal === 'function') {
            openToolModal(toolSlug, true);
        }
    }

    updateHash(section, toolSlug = null) {
        const slug = this.sectionSlugs[section] || section;
        const nextHash = toolSlug ? `#${slug}/${toolSlug}` : `#${slug}`;

        if (window.location.hash !== nextHash) {
            history.replaceState(null, '', nextHash);
        }
    }

    navigateTo(section, updateUrl = true) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        document.getElementById(`${section}Section`).classList.add('active');
        this.currentSection = section;

        if (updateUrl) {
            this.updateHash(section);
        }
    }

    updateApiStatus() {
        const statusEl = document.getElementById('apiStatus');
        const statusText = statusEl.querySelector('.status-text');

        if (aiService.isConnected()) {
            statusEl.classList.add('connected');
            statusText.textContent = 'API Connected';
        } else {
            statusEl.classList.remove('connected');
            statusText.textContent = 'API Not Connected';
        }
    }
}

const app = new App();

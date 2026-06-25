class App {
    constructor() {
        this.currentSection = 'chat';
        this.sectionPaths = {
            chat: '/chat',
            flashcards: '/flashcards',
            quiz: '/quiz',
            smart: '/tools'
        };
        this.pathToSection = {};
        Object.keys(this.sectionPaths).forEach(key => {
            this.pathToSection[this.sectionPaths[key]] = key;
        });
        this.init();
    }

    init() {
        this.setupSidebar();
        this.setupNavigation();
        this.setupMobileNav();
        this.setupToolCards();
        this.setupRouting();
        this.updateApiStatus();
        setInterval(() => this.updateApiStatus(), 5000);
    }

    setupSidebar() {
        const toggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const path = item.getAttribute('data-path') || item.getAttribute('href');
                this.navigateTo(path);
            });
        });
    }

    setupMobileNav() {
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const path = item.getAttribute('href');
                this.navigateTo(path);
            });
        });
    }

    setupToolCards() {
        document.querySelectorAll('.tool-card .btn-secondary[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                const slug = btn.getAttribute('data-tool');
                this.navigateTo('/tools/' + slug);
            });
        });
    }

    setupRouting() {
        window.addEventListener('popstate', () => this.syncFromPath());
        this.syncFromPath(false);
    }

    syncFromPath(pushState = true) {
        const pathname = window.location.pathname;
        const cleanPath = pathname.split('?')[0].split('#')[0];

        if (cleanPath.startsWith('/tools/')) {
            const slug = cleanPath.replace('/tools/', '');
            this.navigateTo('/tools/' + slug, false);
            if (typeof smartFeatures !== 'undefined') {
                smartFeatures.open(slug, true);
            }
            return;
        }

        const section = this.pathToSection[cleanPath] || 'chat';
        this.setActiveSection(section, false);
        if (typeof smartFeatures !== 'undefined') {
            smartFeatures.closeModal();
        }
    }

    navigateTo(path, pushState = true) {
        const section = this.pathToSection[path] || 'chat';

        if (pushState) {
            history.pushState({}, '', path);
        }

        this.setActiveSection(section, false);
        if (typeof smartFeatures !== 'undefined') {
            smartFeatures.closeModal();
        }
    }

    setActiveSection(section, updateUrl = true) {
        this.currentSection = section;

        document.querySelectorAll('.nav-item').forEach(item => {
            const itemSection = item.getAttribute('data-section');
            item.classList.toggle('active', itemSection === section);
        });

        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            const itemSection = item.getAttribute('data-section');
            item.classList.toggle('active', itemSection === section);
        });

        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        const sectionEl = document.getElementById(section + 'Section');
        if (sectionEl) {
            sectionEl.classList.add('active');
        }

        if (updateUrl) {
            const path = this.sectionPaths[section] || '/chat';
            history.pushState({}, '', path);
        }
    }

    updateApiStatus() {
        const statusEl = document.getElementById('apiStatus');
        if (!statusEl) return;
        const textEl = statusEl.querySelector('.status-text');
        if (typeof aiService !== 'undefined' && aiService.isConnected()) {
            statusEl.classList.add('connected');
            if (textEl) textEl.textContent = 'API Connected';
        } else {
            statusEl.classList.remove('connected');
            if (textEl) textEl.textContent = 'API Not Connected';
        }
    }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
    // Ember Particle System
    const particlesContainer = document.getElementById('particles');
    const emberCount = 20;

    for (let i = 0; i < emberCount; i++) {
        createEmber();
    }

    function createEmber() {
        const ember = document.createElement('div');
        ember.classList.add('ember');
        
        // Randomize properties
        const left = Math.random() * 100; // 0 to 100vw
        const width = Math.random() * 4 + 2; // 2px to 6px
        const duration = Math.random() * 8 + 6; // 6s to 14s
        const delay = Math.random() * 5; // 0s to 5s
        
        ember.style.left = `${left}%`;
        ember.style.width = `${width}px`;
        ember.style.height = `${width}px`;
        ember.style.animationDuration = `${duration}s`;
        ember.style.animationDelay = `${delay}s`;
        
        if (particlesContainer) {
            particlesContainer.appendChild(ember);
        }

        // Recreate ember when animation ends to keep it continuous but randomized
        ember.addEventListener('animationend', () => {
            ember.remove();
            createEmber();
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            if (!targetId) return;
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for sticky header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Language Switcher
    const btnEn = document.getElementById('btn-en');
    const btnEs = document.getElementById('btn-es');
    const body = document.body;

    if (btnEn && btnEs) {
        btnEn.addEventListener('click', () => {
            body.classList.remove('lang-es');
            body.classList.add('lang-en');
            btnEn.classList.add('active');
            btnEs.classList.remove('active');
        });

        btnEs.addEventListener('click', () => {
            body.classList.remove('lang-en');
            body.classList.add('lang-es');
            btnEs.classList.add('active');
            btnEn.classList.remove('active');
        });
    }

    // Version Synchronization from CHANGELOG.md
    async function syncVersion() {
        try {
            const response = await fetch('../CHANGELOG.md');
            if (!response.ok) return;
            const text = await response.text();
            
            // Find the first version string like "## vX.X.X"
            const match = text.match(/##\s+(v[0-9]+\.[0-9]+\.[0-9]+)/i);
            if (match && match[1]) {
                const version = match[1];
                const badge = document.getElementById('version-badge');
                if (badge) {
                    const spanEn = badge.querySelector('.lang-en');
                    const spanEs = badge.querySelector('.lang-es');
                    if (spanEn) spanEn.textContent = `Version ${version} Available`;
                    if (spanEs) spanEs.textContent = `Versión ${version} Disponible`;
                }
            }
        } catch (error) {
            console.error('Error fetching version:', error);
        }
    }
    
    // Call it immediately
    syncVersion();
});

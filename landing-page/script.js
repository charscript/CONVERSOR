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

    // Function to fetch and display the latest release from GitHub API
    async function syncGitHubRelease() {
        try {
            const response = await fetch('https://api.github.com/repos/charscript/CONVERSOR/releases/latest');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            const version = data.tag_name;
            const bodyText = data.body;
            const assets = data.assets;

            // 1. Update Version Badges
            const badge = document.getElementById('version-badge');
            if (badge) {
                const spanEn = badge.querySelector('.lang-en');
                const spanEs = badge.querySelector('.lang-es');
                if (spanEn) spanEn.textContent = `Version ${version} Available`;
                if (spanEs) spanEs.textContent = `Versión ${version} Disponible`;
            }

            // 2. Update Changelog Section
            const changelogVersionTag = document.getElementById('changelog-version');
            if (changelogVersionTag) {
                const isEs = document.body.classList.contains('lang-es');
                changelogVersionTag.textContent = isEs ? `Versión ${version}` : `Version ${version}`;
            }
            
            const changelogContent = document.getElementById('changelog-content');
            if (changelogContent && bodyText) {
                // Simple markdown parser for the release body
                let htmlBody = bodyText
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
                    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*)\*/gim, '<em>$1</em>')
                    .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
                    .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>")
                    .replace(/\n$/gim, '<br />');

                // Wrap list items in ul
                htmlBody = htmlBody.replace(/^\s*\-\s(.*)$/gim, '<li>$1</li>');
                htmlBody = htmlBody.replace(/(<li>[\s\S]*?<\/li>)/, '<ul>$1</ul>');

                changelogContent.innerHTML = htmlBody;
            }

            // 3. Update Download Links
            const btnWin = document.getElementById('btn-win-download');
            const btnMac = document.getElementById('btn-mac-download');

            assets.forEach(asset => {
                const name = asset.name.toLowerCase();
                const url = asset.browser_download_url;
                if (name.endsWith('.exe') && btnWin) {
                    btnWin.href = url;
                } else if ((name.endsWith('.command') || name.endsWith('.zip') || name.endsWith('.dmg')) && btnMac) {
                    btnMac.href = url;
                }
            });

        } catch (error) {
            console.error('Error fetching GitHub release:', error);
            const changelogContent = document.getElementById('changelog-content');
            if (changelogContent) {
                changelogContent.innerHTML = '<p>Error loading release notes.</p>';
            }
        }
    }
    
    // Call it immediately
    syncGitHubRelease();

    // OS Detection for Download Buttons
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const winCard = document.getElementById('card-win');
    const macCard = document.getElementById('card-mac');

    if (winCard && macCard) {
        if (isMac) {
            macCard.classList.add('recommended-os');
            winCard.classList.add('secondary-os');
        } else {
            winCard.classList.add('recommended-os');
            macCard.classList.add('secondary-os');
        }
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all others
            faqItems.forEach(other => {
                other.classList.remove('active');
                const answer = other.querySelector('.faq-answer');
                if (answer) answer.style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Custom Cursor & Ambient Glow Tracking
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const ambientGlow = document.querySelector('.ambient-glow');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Animate cursors
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;
        
        // Slight delay on outline for smooth trailing effect
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 150, fill: "forwards" });

        // Ambient glow behind elements follows mouse slowly
        ambientGlow.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 3000, fill: "forwards" });
    });

    // Cursor hover effects on links/buttons
    const attachCursorHover = (element) => {
        if (!element) return;
        element.addEventListener('mouseenter', () => {
            cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursorOutline.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
        });
        element.addEventListener('mouseleave', () => {
            cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorOutline.style.backgroundColor = 'transparent';
        });
    };

    document.querySelectorAll('a, .btn, .social-btn, .theme-toggle, .nav-toggle').forEach(attachCursorHover);

    // 1.5 Theme Toggle
    const themeToggle = document.querySelector('.theme-toggle');
    const setTheme = (theme) => {
        document.body.dataset.theme = theme;
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            }
            themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
            themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        }
        localStorage.setItem('theme', theme);
    };

    const storedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(storedTheme || (prefersLight ? 'light' : 'dark'));

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.dataset.theme === 'light' ? 'light' : 'dark';
            setTheme(currentTheme === 'light' ? 'dark' : 'light');
        });
    }

    // 2. Hacker Text Scramble Effect (Runs on load)
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const scrambleElement = document.querySelector('.scramble-text');
    
    let iterations = 0;
    const originalText = scrambleElement.dataset.value;
    
    const interval = setInterval(() => {
        scrambleElement.innerText = originalText
            .split("")
            .map((letter, index) => {
                if(index < iterations) return originalText[index];
                return letters[Math.floor(Math.random() * 26)];
            })
            .join("");
        
        if(iterations >= originalText.length) clearInterval(interval);
        iterations += 1 / 3; 
    }, 30);


    // 3. Magnetic 3D Tilt Effect for Glass Cards
    const enableTilt = (card) => {
        if (!card) return;
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;  
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; 
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.transition = "transform 0.1s ease";
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = "transform 0.5s ease-out";
        });
    };

    document.querySelectorAll('.tilt-card').forEach(enableTilt);

    // 4. Advanced High-Performance Scroll Reveals (RE-TRIGGERS ON SCROLL)
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            // If the element is visible, run animation
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                // If the element is out of view, remove animation so it can trigger again later!
                entry.target.classList.remove('active'); 
            }
        });
    }, revealOptions);

    const observeRevealElements = (elements) => {
        elements.forEach(el => {
            revealOnScroll.observe(el);
        });
    };

    observeRevealElements(document.querySelectorAll('.reveal-up, .reveal-down, .reveal-left, .reveal-right'));

    // 4.5 GitHub Projects Auto-Sync
    const projectsSection = document.querySelector('#projects');
    const projectsGrid = document.querySelector('#projects-grid');
    const projectsMessage = document.querySelector('#projects-message');

    const setProjectsMessage = (text, isError = false) => {
        if (!projectsMessage) return;
        projectsMessage.textContent = text;
        projectsMessage.style.display = text ? 'block' : 'none';
        projectsMessage.classList.toggle('error', isError);
    };

    if (projectsSection && projectsGrid) {
        const username = projectsSection.dataset.githubUser;
        if (!username) {
            setProjectsMessage('No GitHub user configured for projects.', true);
        } else {
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`, {
                headers: { 'Accept': 'application/vnd.github+json' }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('GitHub request failed');
                    }
                    return response.json();
                })
                .then(repos => {
                    const ownRepos = repos.filter(repo => !repo.fork);
                    projectsGrid.innerHTML = '';

                    if (ownRepos.length === 0) {
                        setProjectsMessage('No public repositories yet.');
                        return;
                    }

                    setProjectsMessage('');

                    ownRepos.forEach((repo, index) => {
                        const card = document.createElement('div');
                        card.className = `glass-card tilt-card reveal-${index % 2 === 0 ? 'left' : 'right'}`;

                        const title = document.createElement('h3');
                        const titleIcon = document.createElement('i');
                        titleIcon.className = 'fa-brands fa-github';
                        title.appendChild(titleIcon);
                        title.append(` ${repo.name}`);

                        const description = document.createElement('p');
                        description.style.color = 'var(--text-muted)';
                        description.style.marginBottom = '20px';
                        description.textContent = repo.description || 'No description yet.';

                        const tags = document.createElement('div');
                        tags.className = 'skill-tags';
                        const tagValues = [];
                        if (repo.language) {
                            tagValues.push(repo.language);
                        }
                        tagValues.push('GitHub');
                        tagValues.forEach(tag => {
                            const span = document.createElement('span');
                            span.textContent = tag;
                            tags.appendChild(span);
                        });

                        const link = document.createElement('a');
                        link.className = 'project-link';
                        link.href = repo.html_url;
                        link.target = '_blank';
                        link.rel = 'noopener';
                        link.append('View on GitHub ');
                        const linkIcon = document.createElement('i');
                        linkIcon.className = 'fa-solid fa-arrow-up-right-from-square';
                        link.appendChild(linkIcon);

                        card.appendChild(title);
                        card.appendChild(description);
                        card.appendChild(tags);
                        card.appendChild(link);

                        projectsGrid.appendChild(card);
                        enableTilt(card);
                        observeRevealElements([card]);
                        attachCursorHover(link);
                    });
                })
                .catch(() => {
                    setProjectsMessage('Unable to load GitHub projects right now.', true);
                });
        }
    }

    // 5. Smooth Nav Scrolling
    const nav = document.querySelector('.glass-nav');
    const navToggle = document.querySelector('.nav-toggle');

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('nav-open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    document.querySelectorAll('.nav-links a, .btn-primary').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }

            if (nav && nav.classList.contains('nav-open')) {
                nav.classList.remove('nav-open');
                if (navToggle) {
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });

});

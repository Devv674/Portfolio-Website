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
        const isDark = theme === 'dark';
        if (isDark) {
            document.body.dataset.theme = 'dark';
        } else {
            document.body.removeAttribute('data-theme');
        }
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            }
            themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }
        localStorage.setItem('theme', theme);
    };

    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

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

    // 4.5 Content Auto-Sync
    const projectsSection = document.querySelector('#projects');
    const projectsGrid = document.querySelector('#projects-grid');
    const projectsMessage = document.querySelector('#projects-message');

    const certificatesGrid = document.querySelector('#certificates-grid');
    const certificatesMessage = document.querySelector('#certificates-message');
    const fallbackCertificates = [
        {
            title: 'Artificial Intelligence Fundamentals',
            issuer: 'IBM-SkillsBuild',
            issue_date: '',
            link: 'https://www.credly.com/badges/5b0a45f1-7de5-44f9-8158-187f81d55e22',
            image: 'https://images.credly.com/images/82b908e1-fdcd-4785-9d32-97f11ccbcf08/linkedin_thumb_image.png',
            description: 'This credential earner demonstrates knowledge of artificial intelligence (AI) concepts, such as natural language processing, computer vision, machine learning, deep learning, chatbots, and neural networks; AI ethics; and the applications of AI.'
        }
    ];

    const setSectionMessage = (element, text, isError = false) => {
        if (!element) return;
        element.textContent = text;
        element.style.display = text ? 'block' : 'none';
        element.classList.toggle('error', isError);
    };

    const fetchJson = (url) => fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(response => {
            if (!response.ok) {
                throw new Error('Request failed');
            }
            return response.json();
        });

    const buildTagList = (tags) => {
        const tagContainer = document.createElement('div');
        tagContainer.className = 'skill-tags';
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.textContent = tag;
            tagContainer.appendChild(span);
        });
        return tagContainer;
    };

    const renderProjectsFromApi = (projects) => {
        if (!projectsGrid) return;
        projectsGrid.innerHTML = '';
        projects.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = `glass-card tilt-card reveal-${index % 2 === 0 ? 'left' : 'right'}`;

            const title = document.createElement('h3');
            const titleIcon = document.createElement('i');
            titleIcon.className = 'fa-solid fa-folder-open';
            title.appendChild(titleIcon);
            title.append(` ${project.title}`);

            const description = document.createElement('p');
            description.style.color = 'var(--text-muted)';
            description.style.marginBottom = '20px';
            description.textContent = project.description || 'No description yet.';

            const tagValues = (project.tags || '')
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean);
            if (project.year) {
                tagValues.push(project.year);
            }

            card.appendChild(title);
            card.appendChild(description);

            if (tagValues.length > 0) {
                card.appendChild(buildTagList(tagValues));
            }

            if (project.link) {
                const link = document.createElement('a');
                link.className = 'project-link';
                link.href = project.link;
                link.target = '_blank';
                link.rel = 'noopener';
                link.append('View Project ');
                const linkIcon = document.createElement('i');
                linkIcon.className = 'fa-solid fa-arrow-up-right-from-square';
                link.appendChild(linkIcon);
                card.appendChild(link);
                attachCursorHover(link);
            }

            projectsGrid.appendChild(card);
            enableTilt(card);
            observeRevealElements([card]);
        });
    };

    const renderProjectsFromGitHub = () => {
        if (!projectsSection || !projectsGrid) return Promise.resolve();
        const username = projectsSection.dataset.githubUser;
        if (!username) {
            setSectionMessage(projectsMessage, 'No GitHub user configured for projects.', true);
            return Promise.resolve();
        }

        return fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`, {
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
                    setSectionMessage(projectsMessage, 'No public repositories yet.');
                    return;
                }

                setSectionMessage(projectsMessage, '');

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

                    const tagValues = [];
                    if (repo.language) {
                        tagValues.push(repo.language);
                    }
                    tagValues.push('GitHub');

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
                    card.appendChild(buildTagList(tagValues));
                    card.appendChild(link);

                    projectsGrid.appendChild(card);
                    enableTilt(card);
                    observeRevealElements([card]);
                    attachCursorHover(link);
                });
            })
            .catch(() => {
                setSectionMessage(projectsMessage, 'Unable to load GitHub projects right now.', true);
            });
    };

    if (projectsGrid) {
        fetchJson('/api/projects')
            .then(projects => {
                if (projects.length > 0) {
                    setSectionMessage(projectsMessage, '');
                    renderProjectsFromApi(projects);
                } else {
                    return renderProjectsFromGitHub();
                }
            })
            .catch(() => {
                renderProjectsFromGitHub();
            });
    }

    const renderContentCards = (items, grid, message, emptyText, builder) => {
        if (!grid) return;
        grid.innerHTML = '';
        if (!items || items.length === 0) {
            setSectionMessage(message, emptyText);
            return;
        }
        setSectionMessage(message, '');
        items.forEach(item => {
            const card = builder(item);
            grid.appendChild(card);
            observeRevealElements([card]);
        });
    };

    const createCertificateCard = (certificate) => {
        const card = document.createElement('div');
        card.className = 'content-card reveal-up';

        if (certificate.image) {
            const image = document.createElement('img');
            image.className = 'certificate-image';
            image.src = certificate.image;
            image.alt = `${certificate.title || 'Certificate'} badge`;
            image.loading = 'lazy';
            card.appendChild(image);
        }

        const title = document.createElement('h3');
        title.textContent = certificate.title;

        const meta = document.createElement('div');
        meta.className = 'content-meta';
        const metaParts = [certificate.issuer, certificate.issue_date].filter(Boolean);
        meta.textContent = metaParts.length ? metaParts.join(' • ') : 'Certificate';

        const description = document.createElement('p');
        description.textContent = certificate.description || 'Certificate details coming soon.';

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(description);

        if (certificate.link) {
            const actions = document.createElement('div');
            actions.className = 'content-actions';
            const link = document.createElement('a');
            link.className = 'project-link';
            link.href = certificate.link;
            link.target = '_blank';
            link.rel = 'noopener';
            link.append('View Credential ');
            const linkIcon = document.createElement('i');
            linkIcon.className = 'fa-solid fa-arrow-up-right-from-square';
            link.appendChild(linkIcon);
            actions.appendChild(link);
            card.appendChild(actions);
            attachCursorHover(link);
        }

        return card;
    };

    if (certificatesGrid) {
        fetchJson('/api/certificates')
            .then(items => {
                if (items && items.length > 0) {
                    renderContentCards(items, certificatesGrid, certificatesMessage, 'No certificates yet.', createCertificateCard);
                    return;
                }
                renderContentCards(fallbackCertificates, certificatesGrid, certificatesMessage, 'No certificates yet.', createCertificateCard);
            })
            .catch(() => renderContentCards(fallbackCertificates, certificatesGrid, certificatesMessage, 'No certificates yet.', createCertificateCard));
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

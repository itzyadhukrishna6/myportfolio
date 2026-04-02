
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis Smooth Scroll
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// --- Scrolling Sound Effect ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let lastScrollY = 0;
let soundEnabled = true;

// GLOBAL VOLUME STATE
let globalVolume = 1.0;

// Attempt to forcefully resume the audio engine immediately on page load
if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.warn('Browser Autoplay Policy blocked the sound on load.'));
}

function playScrollTick(velocity) {
    if (!soundEnabled || globalVolume === 0) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'sine';
    // Frequency sweep downward creates a nice "tick" or "click" sound
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.02);

    // Subtle volume scaling based on velocity to make fast scrolling feel dynamic
    let vol = Math.min(0.2, 0.05 + Math.abs(velocity) * 0.005) * globalVolume; // Increased volume significantly

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
}

// Add variables for marquee tweens
const marqueeTweens = [];
const tracks = document.querySelectorAll('.scrollflow-track');

if (tracks.length > 0) {
    tracks.forEach((track) => {
        const text = track.querySelector('.scrollflow-text');
        const clone = text.cloneNode(true);
        track.appendChild(clone);

        const isLeft = track.classList.contains('dir-left');
        gsap.set(track, { xPercent: isLeft ? 0 : -50 });

        const tw = gsap.to(track, {
            xPercent: isLeft ? -50 : 0,
            ease: "none",
            duration: 35,
            repeat: -1
        });
        marqueeTweens.push({ tween: tw, isLeft });
    });
}

// Trigger sound at intervals during scroll using Lenis
lenis.on('scroll', (e) => {
    const currentScrollY = e.scroll;
    // Play a tick every 60 pixels scrolled
    if (Math.abs(currentScrollY - lastScrollY) > 60) {
        playScrollTick(e.velocity || 5);
        lastScrollY = currentScrollY;
    }

    // Marquee Velocity calculation
    if (marqueeTweens.length > 0) {
        const velocity = e.velocity || 0;
        const scrollDirection = e.direction || 1;

        // Smooth and bounded dynamic timeScale
        let speedMultiplier = 1 + Math.abs(velocity) * 0.015;
        speedMultiplier = Math.min(speedMultiplier, 3); // Cap max speed

        let targetTimeScale = speedMultiplier * scrollDirection;

        marqueeTweens.forEach(({ tween }) => {
            gsap.to(tween, {
                timeScale: targetTimeScale,
                duration: 0.5,
                ease: "power2.out",
                overwrite: "auto"
            });

            clearTimeout(window.marqueeResetTimer);
            window.marqueeResetTimer = setTimeout(() => {
                gsap.to(tween, { timeScale: 1, duration: 1.2, ease: "power3.out", overwrite: "auto" });
            }, 100);
        });
    }
});

// Body Fade In
// Loading Animation

function playLoadingWhoosh() {
    if (!soundEnabled || audioCtx.state === 'suspended' || globalVolume === 0) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    // Deep whoosh/swell
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 1.2);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1.5 * globalVolume, audioCtx.currentTime + 0.3); // Increased Swell up volume to MAX (1.5)
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);    // Fade out

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
}

// --- Volume Control Setup ---
function syncVolumeUI(val) {
    globalVolume = parseFloat(val);
    const volSliders = [document.getElementById('volume-slider'), document.getElementById('volume-slider-mobile')];
    volSliders.forEach(slider => {
        if (slider && slider.value !== val.toString()) slider.value = val;
    });

    const icons = [document.getElementById('volume-icon'), document.getElementById('volume-icon-mobile')];
    icons.forEach(icon => {
        if (!icon) return;
        icon.className = globalVolume === 0 ? 'fa-solid fa-volume-xmark' :
            globalVolume < 0.5 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const volSliders = [document.getElementById('volume-slider'), document.getElementById('volume-slider-mobile')];
    volSliders.forEach(slider => {
        if (slider) {
            slider.addEventListener('input', (e) => {
                syncVolumeUI(e.target.value);
                if (audioCtx.state === 'suspended') audioCtx.resume();
            });
        }
    });

    const icons = [document.getElementById('volume-icon'), document.getElementById('volume-icon-mobile')];
    icons.forEach(icon => {
        if (icon) {
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', () => {
                if (globalVolume > 0) {
                    icon.dataset.lastVol = globalVolume;
                    syncVolumeUI(0);
                } else {
                    syncVolumeUI(icon.dataset.lastVol || 1);
                }
            });
        }
    });
});

// Loading Animation
function startLoader() {
    const loader = document.querySelector('.loading-screen');
    const bg = document.querySelector('.loading-bg');
    const letters = document.querySelectorAll('.loading-text span');
    const line = document.querySelector('.loading-line');
    const lineContainer = document.querySelector('.loading-line-container');

    // Production: Skip loader on return visits within the same session
    const hasVisited = sessionStorage.getItem('hasVisited');

    // If loader element is missing, or we already visited, just reveal content instantly
    if (!loader || hasVisited) {
        if (loader) loader.style.display = 'none';
        document.body.classList.add('loaded');
        sessionStorage.setItem('hasVisited', 'true');
        if (gsap) {
            gsap.set('.navbar', { y: 0, xPercent: -50, opacity: 1 });
            gsap.set('.reveal-item:not(.hero-title)', { y: 0, opacity: 1 });
            gsap.set('.hero-title', { opacity: 1, scale: 1 });
        }
        return;
    }

    // Set initial GSAP states
    if (gsap) {
        gsap.set('.navbar', { y: -100, xPercent: -50, opacity: 0 });
        // We will manually handle the hero-title reveal to sync with loader
        gsap.set('.reveal-item:not(.hero-title)', { y: 50, opacity: 0 });
        gsap.set('.hero-title', { opacity: 0, scale: 0.9 });
    }

    // If GSAP is missing, just hide loader and reveal
    if (!gsap) {
        loader.style.display = 'none';
        document.body.classList.add('loaded');
        revealHeroAndNav();
        return;
    }

    const tl = gsap.timeline();

    // 1. Animate Letters In
    tl.to(letters, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
    })
        // 2. Animate Line Filling
        .to(line, {
            width: "100%",
            duration: 1.2,
            ease: "power2.inOut",
            onStart: playLoadingWhoosh
        })
        // 3. Fade out line
        .to(lineContainer, {
            opacity: 0,
            duration: 0.4,
            ease: "power1.out"
        })
        // 4. TRANSITION: Fade out Black BG, Revealing the site
        .to(bg, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut"
        }, "reveal")
        // 5. Simultaneously, scale up the loader text to mimic zooming into the huge hero text
        .to('.loader-content', {
            scale: 2.5,
            opacity: 0,
            duration: 0.8,
            ease: "power3.in"
        }, "reveal")
        // 6. Reveal the Real Hero content nicely
        .add(() => {
            document.body.classList.add('loaded');
            loader.style.display = 'none';
            revealHeroAndNav();
        }, "-=0.2");
}

// Start loading sequence when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLoader);
} else {
    startLoader();
}

// Animations

// 1. Reveal Hero Items
// 1. Reveal Hero Items
function revealHeroAndNav() {
    const timeline = gsap.timeline();

    // Navbar slide down
    timeline.to('.navbar', {
        y: 0,
        xPercent: -50,
        opacity: 1,
        duration: 1,
        ease: 'power3.out'
    });

    // Hero Title (Pop in/Scale in) - Matches the Loader Zoom Out feel
    timeline.to('.hero-title', {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    }, "-=0.8");

    // Other Items (Profile, Bottom text, etc)
    timeline.to('.reveal-item:not(.hero-title)', {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out'
    }, "-=0.8");
}

// 2. Parallax Effect for Hero Title
// Move text slightly slower than scroll to create depth before being covered
gsap.to('.hero-title', {
    yPercent: 50,
    ease: 'none',
    scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});

// 3. Navbar Color Transition
// Invert navbar text to white when a dark section slides under it
const darkSections = document.querySelectorAll('[data-theme="dark"], .about-section, .cs-overview, .new-footer-design, .contact-section');
darkSections.forEach(sec => {
    ScrollTrigger.create({
        trigger: sec,
        start: 'top 50px', // Just before it hits the navbar
        end: 'bottom 50px',
        toggleClass: { targets: '.navbar', className: 'dark-mode-nav' }
    });
});

// 4. Reveal Text on Scroll (About)
gsap.utils.toArray('.reveal-text').forEach(section => {
    gsap.from(section.children, {
        scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out'
    });
});

// 5. Reveal Project Cards
gsap.utils.toArray('.reveal-card').forEach((card, i) => {
    gsap.to(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 85%',
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: i * 0.1, // innovative staggering
        ease: 'power3.out'
    });
});

// Cursor Follower
const cursor = document.querySelector('.cursor-follower');
if (cursor) {
    // 1. Center the cursor div on the mouse coordinates
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    let mouseX = 0;
    let mouseY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Move the cursor
        gsap.to(cursor, {
            x: mouseX,
            y: mouseY,
            duration: 0.1,
            ease: 'power2.out'
        });
    });

    // Add active state on hover
    const interactiveSelectors = 'a, button, .project-card, input, textarea, .custom-i, .academic-item';
    const interactiveElements = document.querySelectorAll(interactiveSelectors);

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
}

// Back to Top Logic
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        lenis.scrollTo(0);
    });
}


/* Theme Toggle Logic (Framer Physics Drag String) */
const themeSwitchWrapper = document.getElementById('theme-switch-wrapper');
const themeString = document.getElementById('theme-string');
const themePullBox = document.getElementById('theme-pull-box');
const body = document.body;

// Function to update icon
function updateIcons(isDark) {
    const iconClassToRemove = isDark ? 'fa-moon' : 'fa-sun';
    const iconClassToAdd = isDark ? 'fa-sun' : 'fa-moon';

    if (themePullBox) {
        const icon = themePullBox.querySelector('i');
        if (icon) {
            icon.classList.remove(iconClassToRemove);
            icon.classList.add(iconClassToAdd);
        }
    }
}

// Function to enable dark mode
function enableDarkMode() {
    body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    updateIcons(true);
}

// Function to disable dark mode
function disableDarkMode() {
    body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    updateIcons(false);
}

// Check saved theme on load
if (localStorage.getItem('theme') === 'dark') {
    enableDarkMode();
}

// Physics String Pull Logic
if (themeSwitchWrapper) {
    let isDragging = false;
    let startY = 0;
    let startX = 0;
    let currentY = 0;
    let currentX = 0;
    // Maximum comfortable dragging threshold logic before spring tension locks
    const MAX_PULL = 180;
    const MAX_SWING = 60; // Max rotation angle
    // Pull activation breakpoint
    const SNAP_THRESHOLD = 80;

    // Use GSAP to preset the transform so it parses rotation securely
    gsap.set(themeSwitchWrapper, { xPercent: 0, rotation: 0, transformOrigin: 'top center' });

    const onDragStart = (e) => {
        isDragging = true;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        startY = clientY - currentY;
        startX = clientX - currentX;
        document.body.style.userSelect = 'none'; // Prevent text selection
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let diffY = clientY - startY;
        let diffX = clientX - startX;

        // Apply string constraint physics and rubber banding at lower limits
        if (diffY < 0) diffY = 0;
        if (diffY > MAX_PULL) diffY = MAX_PULL + (diffY - MAX_PULL) * 0.15;

        currentY = diffY;
        
        // Horizontal swing calculation
        // The further you pull X, the more it swings
        let swingRot = -(diffX * 0.4); 
        if (swingRot > MAX_SWING) swingRot = MAX_SWING + (swingRot - MAX_SWING) * 0.15;
        if (swingRot < -MAX_SWING) swingRot = -MAX_SWING + (swingRot + MAX_SWING) * 0.15;
        
        currentX = swingRot;

        // Apply visual updates
        gsap.set(themeSwitchWrapper, { rotation: currentX });
        gsap.set(themeString, { height: 50 + currentY }); // base height is 50px
    };

    const onDragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';

        // Toggle state if the user dragged it beyond the breaking point
        if (currentY > SNAP_THRESHOLD) {
            if (body.classList.contains('dark-mode')) {
                disableDarkMode();
            } else {
                enableDarkMode();
            }
        }

        // Native Framer-like snapping using GSAP elastic ease
        gsap.to(themeSwitchWrapper, {
            rotation: 0,
            duration: 2,
            ease: "elastic.out(1, 0.2)",
            onUpdate: function () {
                currentX = parseFloat(gsap.getProperty(themeSwitchWrapper, "rotation")) || 0;
            }
        });

        gsap.to(themeString, {
            height: 50,
            duration: 1,
            ease: "elastic.out(1, 0.3)",
            onUpdate: function () {
                // Read continuous property smoothly back into currentY var for safe interruptive dragging
                currentY = parseFloat(gsap.getProperty(themeString, "height")) - 50;
            }
        });
    };

    // Attach Mouse API Hooks
    themeSwitchWrapper.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    // Attach Native Touch Hooks
    themeSwitchWrapper.addEventListener('touchstart', onDragStart, { passive: true });
    window.addEventListener('touchmove', onDragMove, { passive: true });
    window.addEventListener('touchend', onDragEnd);
}

/* Mobile Menu Logic NEW */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

if (mobileMenuBtn && mobileMenuOverlay) {
    // OPEN Menu
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuOverlay.classList.add('active');
        document.body.classList.add('no-scroll'); // Optional: lock scroll

        // Hide hamburger if wanted, or just keep it under overlay (z-index handles it)

        // Animate links in
        gsap.fromTo('.mobile-nav-link',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, delay: 0.1, ease: 'power2.out' }
        );
    });

    // CLOSE Menu Function
    const closeMenu = () => {
        mobileMenuOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    };

    // Close on X button click
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }

    // Close on Link click
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

// Academic Projects Accordion & Certificate Modal
const academicItems = document.querySelectorAll('.academic-item');
const certificateModal = document.getElementById('certificate-modal');
const certificateModalImg = document.getElementById('certificate-modal-img');
const closeCertificateModal = document.querySelector('.close-certificate-modal');

academicItems.forEach(item => {
    const activate = () => {
        // Remove active from all others
        academicItems.forEach(i => {
            if (i !== item) i.classList.remove('active');
        });

        // Toggle current
        item.classList.add('active');
    };

    const showModal = (e) => {
        e.preventDefault();
        activate();

        const img = item.querySelector('.project-reveal-image img');
        const certUrl = item.getAttribute('data-certificate') || (img ? img.src : null);

        if (certUrl && certificateModal && certificateModalImg) {
            certificateModalImg.src = certUrl;
            certificateModal.style.display = 'flex';
            document.body.classList.add('no-scroll');
        }
    };

    item.addEventListener('mouseenter', activate);
    item.addEventListener('click', showModal);
});

// Close modal logic
if (closeCertificateModal) {
    closeCertificateModal.addEventListener('click', () => {
        if (certificateModal) {
            certificateModal.style.display = 'none';
            document.body.classList.remove('no-scroll');
        }
    });
}

// Close modal on outside click
if (certificateModal) {
    certificateModal.addEventListener('click', (e) => {
        if (e.target === certificateModal) {
            certificateModal.style.display = 'none';
            document.body.classList.remove('no-scroll');
        }
    });
}

/* =========================================
   Dino Runner Game Logic (Interactive Footer)
   ========================================= */
const dinoCanvas = document.getElementById('dinoCanvas');

if (dinoCanvas) {
    const ctx = dinoCanvas.getContext('2d');

    // Game State
    let gameSpeed = 5;
    let score = 0;
    let isGameOver = false;
    let animationId;
    let w, h, floorY;

    // Score UI
    const scoreEl = document.getElementById('dinoScore');
    const msgEl = document.getElementById('dinoMsg');
    const restartBtn = document.getElementById('dinoRestartBtn');

    // Player (Dino - Simple Square)
    const dino = {
        x: 50,
        y: 0,
        width: 30, // Normal square size
        height: 30,
        dy: 0,
        jumpPower: -13,
        gravity: 0.8,
        grounded: false,
        color: '#FBD434'
    };

    // Obstacles
    let obstacles = [];
    let frame = 0;

    // Resize
    const resizeGame = () => {
        w = dinoCanvas.width = dinoCanvas.parentElement.offsetWidth;
        h = dinoCanvas.height = dinoCanvas.parentElement.offsetHeight;
        floorY = h - 20;
    };

    window.addEventListener('resize', resizeGame);
    resizeGame();

    // Start Game logic
    let isPlaying = false;

    const handleJump = () => {
        if (isGameOver) return;

        if (!isPlaying) {
            isPlaying = true;
            if (msgEl) msgEl.style.display = 'none';
            gameLoop();
        }

        if (dino.grounded) {
            dino.dy = dino.jumpPower;
            dino.grounded = false;
            dino.frameY = 3; // Jump Row
            dino.frameX = 0;
        }
    };

    // Inputs
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            const rect = dinoCanvas.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                e.preventDefault();
                handleJump();
            }
        }
    });

    dinoCanvas.addEventListener('mousedown', (e) => { e.preventDefault(); handleJump(); });
    dinoCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleJump(); });

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            resetGame();
        });
    }

    function resetGame() {
        isGameOver = false;
        isPlaying = false;
        obstacles = [];
        score = 0;
        frame = 0;
        gameSpeed = 5;

        dino.y = floorY - dino.height;
        dino.dy = 0;
        dino.grounded = true;
        dino.frameY = 0; // Idle

        if (scoreEl) scoreEl.innerText = '00000';
        if (msgEl) {
            msgEl.innerText = 'PRESS SPACE TO START';
            msgEl.style.display = 'block';
        }
        if (restartBtn) restartBtn.style.display = 'none';

        ctx.clearRect(0, 0, w, h);
        drawStatic();
    }

    function gameLoop() {
        if (isGameOver) return;

        animationId = requestAnimationFrame(gameLoop);
        frame++;

        ctx.clearRect(0, 0, w, h);

        // Update Score
        if (frame % 5 === 0) {
            score++;
            if (scoreEl) scoreEl.innerText = score.toString().padStart(5, '0');
        }

        // Speed up
        if (frame % 500 === 0) gameSpeed += 0.5;

        // Spawn Obstacles
        if (frame % 100 === 0) {
            if (Math.random() > 0.4) {
                const height = Math.random() > 0.5 ? 40 : 25;
                obstacles.push({
                    x: w,
                    y: floorY - height,
                    width: 25,
                    height: height,
                    color: '#555'
                });
            }
        }

        // Dino Physics
        dino.dy += dino.gravity;
        dino.y += dino.dy;

        // Floor Collision
        if (dino.y + dino.height > floorY) {
            dino.y = floorY - dino.height;
            dino.dy = 0;
            dino.grounded = true;
        }



        // Draw Dino
        ctx.fillStyle = dino.color;
        ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

        // Eye
        ctx.fillStyle = 'black';
        // Position eye generally in top-right area
        ctx.fillRect(dino.x + 18, dino.y + 6, 6, 6);

        // Obstacles
        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;

            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

            // Collision
            if (
                dino.x < obs.x + obs.width &&
                dino.x + dino.width > obs.x &&
                dino.y < obs.y + obs.height &&
                dino.y + dino.height > obs.y
            ) {
                gameOver();
            }

            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
                i--;
            }
        }

        // Ground
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(w, floorY);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawStatic() {
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(w, floorY);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Idle
        ctx.fillStyle = dino.color;
        ctx.fillRect(dino.x, floorY - dino.height, dino.width, dino.height);

        ctx.fillStyle = 'black';
        ctx.fillRect(dino.x + 18, floorY - dino.height + 6, 6, 6);
    }

    function gameOver() {
        isGameOver = true;
        cancelAnimationFrame(animationId);
        if (msgEl) {
            msgEl.innerText = 'GAME OVER';
            msgEl.style.display = 'block';
        }
        if (restartBtn) restartBtn.style.display = 'inline-block';
    }



    resetGame();
}

/* =========================================
   Work Filtering & View More Logic
   ========================================= */
const filterButtons = document.querySelectorAll('.skills-pills .pill');
const projectCards = document.querySelectorAll('.project-card');
const viewMoreBtn = document.getElementById('view-more-btn');

let currentFilter = 'all';
let isExpanded = false;
const INITIAL_VISIBLE_COUNT = 4;

function renderProjects() {
    let visibleCount = 0;
    let hiddenCount = 0;

    projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        const matchesFilter = (currentFilter === 'all' || category === currentFilter);

        if (matchesFilter) {
            visibleCount++;
            // If we are NOT expanded and we've exceeded the limit, hide it
            if (!isExpanded && visibleCount > INITIAL_VISIBLE_COUNT) {
                gsap.to(card, {
                    opacity: 0,
                    y: 20,
                    duration: 0.3,
                    overwrite: true,
                    onComplete: () => {
                        card.style.display = 'none';
                        ScrollTrigger.refresh();
                    }
                });
                hiddenCount++;
            } else {
                // Show it
                gsap.to(card, {
                    display: 'block',
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    overwrite: true,
                    onStart: () => {
                        card.style.display = 'block';
                    },
                    onComplete: () => {
                        ScrollTrigger.refresh();
                    }
                });
            }
        } else {
            // Hide non-matching cards immediately
            gsap.to(card, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                overwrite: true,
                onComplete: () => {
                    card.style.display = 'none';
                    ScrollTrigger.refresh();
                }
            });
        }
    });

    // Update View More Button Visibility
    if (viewMoreBtn) {
        if (hiddenCount > 0) {
            viewMoreBtn.style.display = 'inline-flex';
            viewMoreBtn.innerHTML = 'View More <i class="fa-solid fa-arrow-down"></i>';
        } else if (isExpanded && visibleCount > INITIAL_VISIBLE_COUNT) {
            // If expanded and we have more than initial count, show "Show Less" or hide button? 
            // User just asked to "show all", didn't specify toggle back. 
            // But usually "View More" implies extending. 
            // Let's make it disappear if everything is shown, or toggle. 
            // For now, let's just Hide the button if everything is visible as per typical "load more" behavior
            // BUT user might want to collapse. Let's make it toggle for better UX.
            viewMoreBtn.style.display = 'inline-flex';
            viewMoreBtn.innerHTML = 'Show Less <i class="fa-solid fa-arrow-up"></i>';
        } else {
            viewMoreBtn.style.display = 'none';
        }
    }
}

// 1. Filter Button Logic
if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            currentFilter = button.getAttribute('data-filter');
            // Reset expansion when filtering (optional UX choice, keeps list manageable)
            isExpanded = false;

            renderProjects();
        });
    });
}

// 2. View More Logic
if (viewMoreBtn) {
    viewMoreBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        renderProjects();
    });
}

// Initial Render
renderProjects();

/* =========================================
   Skills Orbit Logic
   ========================================= */
const skillsData = [
    { id: 'js', title: 'JavaScript', shortDesc: 'Adding interactivity and dynamic behavior to web applications.', color: '#F7DF1E', icon: '<i class="fa-brands fa-js"></i>' },
    { id: 'react', title: 'React', shortDesc: 'Developing modern, component-based user interfaces for web apps.', color: '#61DAFB', icon: '<i class="fa-brands fa-react"></i>' },
    { id: 'html', title: 'HTML5', shortDesc: 'Building the structure and foundation of web pages.', color: '#E34F26', icon: '<i class="fa-brands fa-html5"></i>' },
    { id: 'css', title: 'CSS3', shortDesc: 'Designing layouts, animations, and responsive user interfaces.', color: '#1572B6', icon: '<i class="fa-brands fa-css3-alt"></i>' },
    { id: 'figma', title: 'Figma', shortDesc: 'Designing user interfaces, wireframes, and interactive prototypes.', color: '#A259FF', icon: '<i class="fa-brands fa-figma"></i>' },
    { id: 'xd', title: 'Adobe XD', shortDesc: 'Designing and prototyping user experiences and interfaces.', color: '#FF61F6', icon: '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/xd/xd-original.svg" alt="Adobe XD">' },
    { id: 'sketch', title: 'Sketch', shortDesc: 'Creating clean and structured UI designs and layouts.', color: '#FDBB2A', icon: '<i class="fa-brands fa-sketch"></i>' },
    { id: 'photoshop', title: 'Adobe Photoshop', shortDesc: 'Editing images and creating detailed visual designs.', color: '#31A8FF', icon: '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/photoshop/photoshop-original.svg" alt="Photoshop">' },
    { id: 'canva', title: 'Canva', shortDesc: 'Designing quick visuals, social graphics, and creative assets.', color: '#00C4CC', icon: '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/canva/canva-original.svg" alt="Canva">' },
    { id: 'github', title: 'GitHub', shortDesc: 'Managing code, version control, and collaborating on projects.', color: '#ffffff', icon: '<i class="fa-brands fa-github"></i>' },
    { id: 'blender', title: 'Blender', shortDesc: 'Creating basic 3D models and visuals for interactive and creative experiences.', color: '#EA7600', icon: '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/blender/blender-original.svg" alt="Blender">' },
];

const orbitRing = document.getElementById('orbit-ring');
const centerIconWrapper = document.getElementById('center-icon-wrapper');
const centerSkillTitle = document.getElementById('center-skill-title');
const centerSkillDesc = document.getElementById('center-skill-desc');
const skillsGlow = document.getElementById('skills-glow');
const btnContactSkill = document.getElementById('btn-contact-skill');

if (orbitRing) {
    const totalSkills = skillsData.length;
    skillsData.forEach((skill, index) => {
        const angle = (index / totalSkills) * 360;

        // Create Orbit Item
        const item = document.createElement('div');
        item.className = 'orbit-item';
        item.style.setProperty('--angle', `${angle}deg`);

        const inner = document.createElement('div');
        inner.className = 'orbit-item-inner';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'orbit-icon';
        iconDiv.innerHTML = skill.icon;

        // Default white to dark icon, but we use their color to make it clear.
        // But for better look, we can just make it fully colored.
        iconDiv.style.color = skill.color;

        inner.appendChild(iconDiv);
        item.appendChild(inner);
        orbitRing.appendChild(item);

        // Setup click handler
        item.addEventListener('click', () => {
            updateActiveSkill(skill);

            // Subtle pop animation on click
            gsap.fromTo(centerIconWrapper,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
            );
        });
    });

    // Function to update the center content
    function updateActiveSkill(skill) {
        centerIconWrapper.innerHTML = skill.icon;
        centerIconWrapper.style.color = skill.color;
        // The text shadow is maintained in CSS and we override via color property since shadow uses currentColor,
        // but let's override directly just to be safe.
        centerIconWrapper.style.filter = `drop-shadow(0 0 25px ${skill.color})`;

        centerSkillTitle.innerText = skill.title;
        centerSkillDesc.innerText = skill.shortDesc;

        // Ensure glowing aura blends gracefully
        skillsGlow.style.background = `radial-gradient(circle, ${skill.color} 0%, transparent 60%)`;
        btnContactSkill.style.backgroundColor = skill.color;

        // For buttons that are dark, ensure font is dark so it stands out on the bright color
        btnContactSkill.style.color = '#000';
    }

    // Set defaults
    updateActiveSkill(skillsData[0]);
}

/* =========================================
   Playful Eyes Animation (Framer-like logic)
   ========================================= */
const playfulEyes = document.querySelectorAll('.playful-eyes .eye');
if (playfulEyes.length > 0) {
    // 1. Center the pupils using GSAP cleanly initially so x/y properties animate freely
    gsap.set('.pupil', { xPercent: -50, yPercent: -50 });

    window.addEventListener('mousemove', (e) => {
        playfulEyes.forEach(eye => {
            const pupil = eye.querySelector('.pupil');
            if (!pupil) return;

            const rect = eye.getBoundingClientRect();
            // Find center of the white eye container
            const eyeCenterX = rect.left + rect.width / 2;
            const eyeCenterY = rect.top + rect.height / 2;

            // Pre-calculated boundaries: Eye is 50x75, Pupil is 28x42
            const maxMoveX = 9;
            const maxMoveY = 14;

            // Calculate precise angle and distance from center
            const dx = e.clientX - eyeCenterX;
            const dy = e.clientY - eyeCenterY;
            const distance = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);

            // Increased sensitivity: earlier clamping (200px instead of 400px range)
            const mappedDist = Math.min(1, distance / 200);

            // Ease out mapping for premium Framer-like physical sensation at the edges
            const easedDist = mappedDist * (2 - mappedDist);

            const moveX = Math.cos(angle) * maxMoveX * easedDist;
            const moveY = Math.sin(angle) * maxMoveY * easedDist;

            // Target absolute x/y so it stacks safely on top of GSAP's set xPercent/yPercent
            gsap.to(pupil, {
                x: moveX,
                y: moveY,
                duration: 0.15,
                ease: "power2.out",
                overwrite: "auto"
            });
        });
    });
}

/* =========================================
   Image Path Component (Hero Image Trail)
   ========================================= */
const trailContainer = document.getElementById('image-trail-container');
const heroSection = document.querySelector('.hero-section');

if (trailContainer && heroSection) {
    // Collect a cool array of project/lifestyle images from public payload
    const trailImagesSrc = [
        './public/images/horn.png',
        './public/images/h1.png',
        './public/images/h2.png',
        './public/images/h3.png',
        './public/images/h4.png',
        './public/images/h5.png'
    ];

    let trailIndex = 0;
    let lastMousePos = { x: 0, y: 0 };
    // Threshold distance (pixels) between spawned images
    const threshold = 100;

    document.addEventListener('mousemove', (e) => {
        // Prevent trail tracking if hovering over the navbar interactions
        if (e.target.closest('nav') || e.target.closest('.nav-container')) return;

        // Strictly restrict spawning bounds to inside the hero visual rect
        const heroRect = heroSection.getBoundingClientRect();
        if (e.clientY < heroRect.top || e.clientY > heroRect.bottom) return;

        const mousePos = { x: e.clientX, y: e.clientY };
        const dist = Math.hypot(mousePos.x - lastMousePos.x, mousePos.y - lastMousePos.y);

        if (dist > threshold) {
            lastMousePos = mousePos;
            spawnTrailImage(mousePos.x, mousePos.y);
        }
    });

    function spawnTrailImage(x, y) {
        // Convert client cursor coordinates to match the absolute container rendering cleanly
        const rect = trailContainer.getBoundingClientRect();
        const relX = x - rect.left;
        const relY = y - rect.top;

        const img = document.createElement('img');
        img.src = trailImagesSrc[trailIndex];
        img.className = 'trail-image';
        trailContainer.appendChild(img);

        trailIndex = (trailIndex + 1) % trailImagesSrc.length;

        // Add magnetic random stagger rotation for an organic, hand-dealt card physical sensation
        const randomRotation = gsap.utils.random(-15, 15);

        // Render parameters
        gsap.set(img, {
            x: relX,
            y: relY,
            xPercent: -50,
            yPercent: -50,
            rotation: randomRotation,
            scale: 0.2,
            opacity: 0
        });

        // The exact physics parameters defining the Trail
        const tl = gsap.timeline({
            onComplete: () => {
                img.remove();
            }
        });

        // Orchestrate appearance, drift, and subsequent decay
        tl.to(img, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(1.5)"
        })
            .to(img, {
                y: relY - 60, // Magnetic drift upward gradually like gravity decay
                x: relX + gsap.utils.random(-20, 20),
                rotation: randomRotation + gsap.utils.random(-10, 10),
                duration: 1.5,
                ease: "power2.out"
            }, "-=0.2")
            .to(img, {
                scale: 0.3,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in"
            }, "-=0.5");
    }
}

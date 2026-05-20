/* ── Shamse Swim — main.js ──────────────────────────────────────────────── */

// ── Loading screen ─────────────────────────────────────────────────────────
const loadingScreen = document.getElementById('loading-screen');

function hideLoader() {
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
}

// Hide after 1.8s or when DOM is fully ready, whichever comes last
const loaderTimer = setTimeout(hideLoader, 1800);

if (document.readyState === 'complete') {
  clearTimeout(loaderTimer);
  setTimeout(hideLoader, 1800);
} else {
  window.addEventListener('load', () => {
    clearTimeout(loaderTimer);
    setTimeout(hideLoader, 1800);
  });
}

// ── Custom golden-sun cursor + bead trail ──────────────────────────────────
const cursorDot    = document.getElementById('cursor-dot');
const cursorCanvas = document.getElementById('cursor-canvas');
const isMobile     = window.matchMedia('(max-width: 680px)').matches;

let mouseX = -100, mouseY = -100;

if (!isMobile && cursorDot && cursorCanvas) {
  const cCtx = cursorCanvas.getContext('2d');
  cursorCanvas.width  = window.innerWidth;
  cursorCanvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    cursorCanvas.width  = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
  }, { passive: true });

  // Bead trail particles
  const BEAD_COLORS = ['#1D9E8F','#C9A84C','#9B7FCC','#C9846A','#E05A3A','#2A5FAC','#2E8B6A','#D4820A'];
  const MAX_PARTICLES = 18;
  const particles = [];

  class Particle {
    constructor(x, y) {
      this.x     = x;
      this.y     = y;
      this.r     = 4 + Math.random() * 5;
      this.color = BEAD_COLORS[Math.floor(Math.random() * BEAD_COLORS.length)];
      this.alpha = 0.85;
      this.vx    = (Math.random() - 0.5) * 1.5;
      this.vy    = (Math.random() - 0.5) * 1.5 - 0.5;
      this.decay = 0.035 + Math.random() * 0.025;
    }

    update() {
      this.x     += this.vx;
      this.y     += this.vy;
      this.alpha -= this.decay;
    }

    draw() {
      cCtx.save();
      cCtx.globalAlpha = Math.max(0, this.alpha);
      const grad = cCtx.createRadialGradient(
        this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.1,
        this.x, this.y, this.r
      );
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.4, this.color);
      grad.addColorStop(1, this.color + '88');
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.restore();
    }
  }

  let framesSinceParticle = 0;

  function animateCursor() {
    cCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    framesSinceParticle++;
    if (framesSinceParticle >= 3 && particles.length < MAX_PARTICLES) {
      particles.push(new Particle(mouseX, mouseY));
      framesSinceParticle = 0;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  });

  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    cursorDot.style.opacity = '1';
  });
}

// ── Mobile nav toggle ──────────────────────────────────────────────────────
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Nav scroll behaviour ───────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Mouse parallax on hero logo ────────────────────────────────────────────
const heroLogo = document.getElementById('hero-logo');
const hero     = document.getElementById('hero');

if (hero && heroLogo) {
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const cx   = rect.width / 2;
    const cy   = rect.height / 2;
    const dx   = (e.clientX - rect.left - cx) / cx;
    const dy   = (e.clientY - rect.top  - cy) / cy;
    heroLogo.style.transform = `translate(${dx * 16}px, ${dy * 10}px)`;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    heroLogo.style.transform = '';
  });
}

// ── Hero parallax tatreez watermark ───────────────────────────────────────
const heroTatreezBg = document.querySelector('.hero-tatreez-bg');

window.addEventListener('scroll', () => {
  if (!heroTatreezBg) return;
  const scrolled = window.scrollY;
  heroTatreezBg.style.transform = `translateY(${scrolled * 0.3}px)`;
}, { passive: true });

// ── Hero + floating elements fade on scroll ────────────────────────────────
const heroCanvas    = document.getElementById('tatreez-canvas');
const floatingStars = document.querySelector('.floating-stars');
const heroContent   = document.querySelector('.hero-content');
const scrollHint    = document.querySelector('.scroll-hint');
const heroBeads     = document.getElementById('hero-beads');

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const maxFade  = window.innerHeight * 0.7;
  const opacity  = Math.max(0, 1 - scrolled / maxFade);

  if (heroCanvas)    heroCanvas.style.opacity    = opacity * 0.05;
  if (floatingStars) floatingStars.style.opacity = opacity;
  if (heroContent)   heroContent.style.opacity   = opacity;
  if (scrollHint)    scrollHint.style.opacity    = opacity;
  if (heroBeads)     heroBeads.style.opacity      = opacity;
}, { passive: true });

// ── Scroll reveal via IntersectionObserver ─────────────────────────────────
const revealEls = document.querySelectorAll('.reveal-section');

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

revealEls.forEach(el => revealObs.observe(el));

// ── Staggered product card entrance ───────────────────────────────────────
const shopGrid = document.querySelector('.shop-grid');

if (shopGrid) {
  const cards = Array.from(shopGrid.querySelectorAll('.product-card'));

  const cardObs = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      cards.forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.12}s`;
        card.classList.add('card-visible');
      });
      cardObs.disconnect();
    }
  }, { threshold: 0.1 });

  cardObs.observe(shopGrid);
}

// ── Tatreez canvas animation ──────────────────────────────────────────────
(function initTatreez() {
  const canvas = document.getElementById('tatreez-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Jewel-tone palette for watermark
  const colours = [
    'rgba(201,168,76,0.8)',
    'rgba(29,158,143,0.7)',
    'rgba(155,127,204,0.7)',
    'rgba(201,132,106,0.65)',
    'rgba(224,90,58,0.65)',
    'rgba(46,139,106,0.6)',
  ];

  function drawCross(x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = size * 0.22;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
    ctx.restore();
  }

  function drawShamse(x, y, r, color, alpha) {
    const rays = 8;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = color;
    ctx.beginPath();
    for (let i = 0; i < rays * 2; i++) {
      const angle  = (Math.PI * i / rays) - Math.PI / 2;
      const radius = (i % 2 === 0) ? r : r * 0.44;
      const px     = x + radius * Math.cos(angle);
      const py     = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCypress(x, y, h, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const ty = y - (i + 1) * h / (steps + 1);
      const bw = (h / 8) * (1 - i / steps);
      ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - bw, ty - bw * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x + bw, ty - bw * 0.4); ctx.stroke();
    }
    ctx.restore();
  }

  function buildMotifs() {
    const motifs  = [];
    const colStep = 90;
    const rowStep = 80;

    for (let col = 0; col * colStep < W + colStep * 2; col++) {
      for (let row = 0; row * rowStep < H + rowStep * 2; row++) {
        const x     = col * colStep + (row % 2) * 45 - 20;
        const y     = row * rowStep - 20;
        const type  = (col + row) % 5;
        const color = colours[(col * 3 + row) % colours.length];
        const delay = Math.random() * 280;

        if (type === 0) {
          motifs.push({ kind: 'shamse', x, y, r: 20, color, delay, alpha: 0, targetAlpha: 0.7 });
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            motifs.push({
              kind: 'cross', x: x + 32 * Math.cos(a), y: y + 32 * Math.sin(a),
              size: 5, color, delay: delay + k * 12, alpha: 0, targetAlpha: 0.55,
            });
          }
        } else if (type === 1) {
          motifs.push({ kind: 'cypress', x, y, h: 55, color, delay, alpha: 0, targetAlpha: 0.5 });
        } else {
          for (let di = 0; di < 3; di++) {
            for (let dj = 0; dj < 3; dj++) {
              motifs.push({
                kind: 'cross',
                x: x + di * 16 - 16,
                y: y + dj * 16 - 16,
                size: 5, color,
                delay: delay + (di + dj) * 18,
                alpha: 0, targetAlpha: 0.45,
              });
            }
          }
        }
      }
    }
    return motifs;
  }

  const motifs     = buildMotifs();
  let   startTime  = null;
  const FADE_SPEED = 0.018;

  function render(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;

    ctx.clearRect(0, 0, W, H);

    for (const m of motifs) {
      if (elapsed < m.delay) continue;

      if (m.alpha < m.targetAlpha) {
        m.alpha = Math.min(m.targetAlpha, m.alpha + FADE_SPEED);
      }

      if (m.alpha <= 0) continue;

      if (m.kind === 'shamse') {
        drawShamse(m.x, m.y, m.r, m.color, m.alpha);
      } else if (m.kind === 'cross') {
        drawCross(m.x, m.y, m.size, m.color, m.alpha);
      } else if (m.kind === 'cypress') {
        drawCypress(m.x, m.y, m.h, m.color, m.alpha);
      }
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();

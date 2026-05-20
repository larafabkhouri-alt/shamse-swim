/* ── Shamse Swim — main.js ──────────────────────────────────────────────── */

// ── Nav scroll behaviour ───────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Mouse parallax on hero logo ────────────────────────────────────────────
const heroLogo = document.getElementById('hero-logo');
const hero     = document.getElementById('hero');

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

// ── Hero + floating elements fade on scroll ────────────────────────────────
const heroCanvas       = document.getElementById('tatreez-canvas');
const floatingStars    = document.querySelector('.floating-stars');
const heroContent      = document.querySelector('.hero-content');
const scrollHint       = document.querySelector('.scroll-hint');

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const maxFade  = window.innerHeight * 0.7;
  const opacity  = Math.max(0, 1 - scrolled / maxFade);

  if (heroCanvas)    heroCanvas.style.opacity    = opacity * 0.7;
  if (floatingStars) floatingStars.style.opacity = opacity;
  if (heroContent)   heroContent.style.opacity   = opacity;
  if (scrollHint)    scrollHint.style.opacity    = opacity;
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

// ── Tatreez canvas animation ──────────────────────────────────────────────
(function initTatreez() {
  const canvas = document.getElementById('tatreez-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ── Colour palette (warm gold/tan on peach) ──
  const colours = [
    'rgba(212,165,53,0.65)',   // gold
    'rgba(180,130,40,0.5)',    // dark gold
    'rgba(200,150,60,0.55)',   // amber
    'rgba(160,110,40,0.45)',   // brown gold
    'rgba(240,200,100,0.4)',   // light gold
  ];

  // ── Stitch primitive: a small X cross ──
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

  // ── 8-pointed shamse ──
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

  // ── Cypress tree silhouette (simplified) ──
  function drawCypress(x, y, h, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    // central trunk
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    // branches
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const ty  = y - (i + 1) * h / (steps + 1);
      const bw  = (h / 8) * (1 - i / steps);
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x - bw, ty - bw * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x + bw, ty - bw * 0.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Build a list of "motifs" spread across the canvas ──
  function buildMotifs() {
    const motifs = [];
    const colStep = 90;
    const rowStep = 80;

    for (let col = 0; col * colStep < W + colStep * 2; col++) {
      for (let row = 0; row * rowStep < H + rowStep * 2; row++) {
        const x = col * colStep + (row % 2) * 45 - 20;
        const y = row * rowStep - 20;

        const type = (col + row) % 5;
        const color = colours[(col * 3 + row) % colours.length];
        const delay = Math.random() * 280; // stagger draw-in

        if (type === 0) {
          // shamse motif — several stitches around a central star
          motifs.push({ kind: 'shamse', x, y, r: 20, color, delay, alpha: 0, targetAlpha: 0.6 });
          // surrounding crosses
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            motifs.push({
              kind: 'cross', x: x + 32 * Math.cos(a), y: y + 32 * Math.sin(a),
              size: 5, color, delay: delay + k * 12, alpha: 0, targetAlpha: 0.5,
            });
          }
        } else if (type === 1) {
          // cypress tree
          motifs.push({ kind: 'cypress', x, y, h: 55, color, delay, alpha: 0, targetAlpha: 0.45 });
        } else {
          // grid of crosses
          for (let di = 0; di < 3; di++) {
            for (let dj = 0; dj < 3; dj++) {
              motifs.push({
                kind: 'cross',
                x: x + di * 16 - 16,
                y: y + dj * 16 - 16,
                size: 5, color,
                delay: delay + (di + dj) * 18,
                alpha: 0, targetAlpha: 0.4,
              });
            }
          }
        }
      }
    }
    return motifs;
  }

  const motifs      = buildMotifs();
  let   startTime   = null;
  const FADE_SPEED  = 0.018;

  function render(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;

    ctx.clearRect(0, 0, W, H);

    let allDone = true;

    for (const m of motifs) {
      if (elapsed < m.delay) { allDone = false; continue; }

      if (m.alpha < m.targetAlpha) {
        m.alpha = Math.min(m.targetAlpha, m.alpha + FADE_SPEED);
        if (m.alpha < m.targetAlpha) allDone = false;
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

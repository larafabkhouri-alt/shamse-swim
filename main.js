/* ── Shamse Swim — main.js ──────────────────────────────────────────────── */

// ── Loading screen ─────────────────────────────────────────────────────────
const loadingScreen = document.getElementById('loading-screen');

function hideLoader() {
  if (loadingScreen) loadingScreen.classList.add('hidden');
}

window.addEventListener('load', () => { setTimeout(hideLoader, 1800); });
setTimeout(hideLoader, 2400); // hard fallback

// ── Custom golden-sun cursor + bead trail ──────────────────────────────────
const cursorDot    = document.getElementById('cursor-dot');
const cursorCanvas = document.getElementById('cursor-canvas');
const isMobile     = window.matchMedia('(max-width: 600px)').matches;

let mouseX = -200, mouseY = -200;

if (!isMobile && cursorDot && cursorCanvas) {
  const cCtx = cursorCanvas.getContext('2d');

  function resizeCursorCanvas() {
    cursorCanvas.width  = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
  }
  resizeCursorCanvas();
  window.addEventListener('resize', resizeCursorCanvas, { passive: true });

  const BEAD_COLORS = [
    '#0D9E8F','#C9A84C','#8E70C6','#CC6E82',
    '#E0522A','#2455A6','#1A8C6A','#D47A0A',
  ];
  const MAX_PARTICLES = 16;
  const particles = [];

  class Particle {
    constructor(x, y) {
      this.x     = x + (Math.random() - 0.5) * 6;
      this.y     = y + (Math.random() - 0.5) * 6;
      this.r     = 3.5 + Math.random() * 4;
      this.color = BEAD_COLORS[Math.floor(Math.random() * BEAD_COLORS.length)];
      this.alpha = 0.8;
      this.vx    = (Math.random() - 0.5) * 1.2;
      this.vy    = (Math.random() - 0.5) * 1.2 - 0.4;
      this.decay = 0.04 + Math.random() * 0.022;
    }

    update() {
      this.x    += this.vx;
      this.y    += this.vy;
      this.alpha -= this.decay;
    }

    draw() {
      if (this.alpha <= 0) return;
      cCtx.save();
      cCtx.globalAlpha = Math.max(0, this.alpha);
      const g = cCtx.createRadialGradient(
        this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.08,
        this.x, this.y, this.r
      );
      g.addColorStop(0, '#fff');
      g.addColorStop(0.35, this.color);
      g.addColorStop(1, this.color + '55');
      cCtx.fillStyle = g;
      cCtx.beginPath();
      cCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.restore();
    }
  }

  let frameCount = 0;
  let isMoving   = false;
  let moveTimer  = null;

  function animateCursor() {
    cCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    frameCount++;

    if (isMoving && frameCount % 3 === 0 && particles.length < MAX_PARTICLES) {
      particles.push(new Particle(mouseX, mouseY));
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
    cursorDot.style.left    = mouseX + 'px';
    cursorDot.style.top     = mouseY + 'px';
    cursorDot.style.opacity = '1';
    isMoving = true;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => { isMoving = false; }, 80);
  });

  document.addEventListener('mouseleave', () => { cursorDot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursorDot.style.opacity = '1'; });
}

// ── Cart state ─────────────────────────────────────────────────────────────
const cart = { items: [] };

function cartTotal() {
  return cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartItemCount() {
  return cart.items.reduce((sum, item) => sum + item.qty, 0);
}

function renderCart() {
  const itemsEl  = document.getElementById('cart-items');
  const emptyEl  = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');
  const totalEl  = document.getElementById('cart-total');
  const countEl  = document.getElementById('cart-count');

  const count = cartItemCount();

  // Cart count badge
  countEl.textContent = count;
  countEl.classList.toggle('visible', count > 0);

  if (count === 0) {
    emptyEl.style.display  = '';
    footerEl.style.display = 'none';
    // Clear items except the empty message
    Array.from(itemsEl.children).forEach(c => { if (c !== emptyEl) c.remove(); });
    return;
  }

  emptyEl.style.display  = 'none';
  footerEl.style.display = '';
  totalEl.textContent    = '$' + cartTotal().toLocaleString();

  // Remove existing item rows
  Array.from(itemsEl.querySelectorAll('.cart-item')).forEach(c => c.remove());

  cart.items.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-img">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,${item.color}99,${item.color}55);"></div>
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">Size: ${item.size}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-idx="${idx}" data-delta="-1" aria-label="Decrease quantity">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" data-idx="${idx}" data-delta="1" aria-label="Increase quantity">+</button>
        </div>
        <button class="cart-remove" data-idx="${idx}">Remove</button>
      </div>
      <div class="cart-item-price">$${(item.price * item.qty).toLocaleString()}</div>
    `;
    itemsEl.appendChild(el);
  });

  // Delegate events
  itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx   = parseInt(btn.dataset.idx);
      const delta = parseInt(btn.dataset.delta);
      cart.items[idx].qty = Math.max(1, cart.items[idx].qty + delta);
      renderCart();
    });
  });

  itemsEl.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.items.splice(parseInt(btn.dataset.idx), 1);
      renderCart();
    });
  });
}

// ── Cart drawer open/close ─────────────────────────────────────────────────
const cartDrawer  = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('nav-cart-btn').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartDrawer.classList.contains('open')) closeCart();
});

// ── Size selector ──────────────────────────────────────────────────────────
document.querySelectorAll('.size-selector').forEach(selector => {
  selector.querySelectorAll('.size-pill:not(.out-of-stock)').forEach(pill => {
    pill.addEventListener('click', () => {
      selector.querySelectorAll('.size-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });
});

// ── Add to cart ────────────────────────────────────────────────────────────
document.querySelectorAll('.btn-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const card    = btn.closest('.product-card');
    const selector = card.querySelector('.size-selector');
    const selected = selector.querySelector('.size-pill.selected');

    if (!selected) {
      selector.classList.remove('shake');
      void selector.offsetWidth; // reflow to restart animation
      selector.classList.add('shake');
      return;
    }

    const productId = btn.dataset.productId;
    const name      = btn.dataset.name;
    const price     = parseInt(btn.dataset.price);
    const color     = btn.dataset.color;
    const size      = selected.dataset.size;

    // Check if same product + size already in cart
    const existing = cart.items.find(i => i.id === productId && i.size === size);
    if (existing) {
      existing.qty++;
    } else {
      cart.items.push({ id: productId, name, price, color, size, qty: 1 });
    }

    renderCart();

    // Button feedback
    const orig = btn.textContent;
    btn.textContent = 'Added ✓';
    btn.classList.add('added');
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1400);

    // Open cart drawer briefly after adding
    setTimeout(openCart, 500);
  });
});

// Initialise cart UI
renderCart();

// ── Mobile nav toggle ──────────────────────────────────────────────────────
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// ── Nav scroll behaviour ───────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Hero background mouse + scroll parallax ────────────────────────────────
const hero          = document.getElementById('hero');
const heroTatreezBg = document.querySelector('.hero-tatreez-bg');
const heroCanvas    = document.getElementById('tatreez-canvas');
const floatingStars = document.querySelector('.floating-stars');
const heroContent   = document.querySelector('.hero-content');
const scrollHint    = document.querySelector('.scroll-hint');

let tatreezScrollY = 0;
let bgMouseX = 0, bgMouseY = 0;

function applyTatreezTransform() {
  if (heroTatreezBg) {
    heroTatreezBg.style.transform = `translateY(${tatreezScrollY}px) translate(${bgMouseX}px, ${bgMouseY}px)`;
  }
}

if (hero) {
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const dx   = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const dy   = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    bgMouseX = dx * -14;
    bgMouseY = dy * -9;
    applyTatreezTransform();
    if (heroCanvas)    heroCanvas.style.transform    = `translate(${dx * -9}px, ${dy * -6}px)`;
    if (floatingStars) floatingStars.style.transform = `translate(${dx * 18}px, ${dy * 12}px)`;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    bgMouseX = 0; bgMouseY = 0;
    applyTatreezTransform();
    if (heroCanvas)    heroCanvas.style.transform    = '';
    if (floatingStars) floatingStars.style.transform = '';
  });
}

window.addEventListener('scroll', () => {
  const s       = window.scrollY;
  const maxFade = window.innerHeight * 0.72;
  const opacity = Math.max(0, 1 - s / maxFade);

  tatreezScrollY = s * 0.3;
  applyTatreezTransform();
  if (heroCanvas)    heroCanvas.style.opacity    = opacity * 0.18;
  if (floatingStars) floatingStars.style.opacity = opacity;
  if (heroContent)   heroContent.style.opacity   = opacity;
  if (scrollHint)    scrollHint.style.opacity    = opacity;
}, { passive: true });

// ── Scroll reveal ──────────────────────────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal-section').forEach(el => revealObs.observe(el));

// ── Staggered product card entrance ───────────────────────────────────────
const shopGrid = document.querySelector('.shop-grid');
if (shopGrid) {
  const cards   = Array.from(shopGrid.querySelectorAll('.product-card'));
  const cardObs = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      cards.forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.1}s`;
        card.classList.add('card-visible');
      });
      cardObs.disconnect();
    }
  }, { threshold: 0.08 });
  cardObs.observe(shopGrid);
}

// ── Tatreez canvas animation ──────────────────────────────────────────────
function initTatreezCanvas(canvasId, opts) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const colours = [
    'rgba(235,215,95,1)',
    'rgba(13,158,143,1)',
    'rgba(142,112,198,1)',
    'rgba(204,110,130,1)',
    'rgba(224,82,42,1)',
    'rgba(36,85,166,1)',
    'rgba(26,140,106,1)',
    'rgba(212,122,10,1)',
  ];

  function drawCross(x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = size * 0.2;
    ctx.lineCap     = 'round';
    ctx.beginPath(); ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size); ctx.stroke();
    ctx.restore();
  }

  function drawShamse(x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = color;
    const s = r / 46; // scale from 100x100 design (radius=46)
    for (let i = 0; i < 16; i++) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(i * Math.PI / 8); // 22.5° each
      ctx.scale(s, s);
      ctx.translate(-50, -50);
      ctx.beginPath();
      ctx.moveTo(48.5, 25);
      ctx.bezierCurveTo(45, 17, 49, 7, 50, 4);
      ctx.bezierCurveTo(51, 7, 55, 17, 51.5, 25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // center ring
    ctx.beginPath();
    ctx.arc(x, y, r * 0.46, 0, Math.PI * 2);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = r * 0.09;
    ctx.stroke();
    // center disk
    ctx.beginPath();
    ctx.arc(x, y, r * 0.30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawDiamond(x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function buildMotifs() {
    const motifs = [];
    const SC    = 5;            // px per stitch
    const tileW = 40 * SC;     // 200 px
    const tileH = 40 * SC;     // 200 px
    const csz   = SC * 0.44;   // cross arm half-length

    function xc(x, y, color, delay, alpha) {
      motifs.push({ kind:'cross', x, y, size: csz, color, delay, alpha:0, targetAlpha: alpha });
    }

    // Pixel-accurate stitch tile (40×40 stitch-units, band at y=20).
    // Each entry: [stitch_x, stitch_y, alpha]
    const STITCHES = [];

    // Band — full row at y=20
    for (let x = 0; x < 40; x++)
      STITCHES.push([x, 20, 0.86]);

    // Crown — large upward V, apex (20,0) → arms (1,19) & (39,19)
    for (let t = 0; t <= 19; t++) {
      STITCHES.push([20 - t, t, 0.82]);
      if (t > 0) STITCHES.push([20 + t, t, 0.82]);
    }

    // Pendant — large downward V below band, apex (20,21) → arms (2,39) & (38,39)
    for (let t = 0; t <= 18; t++) {
      STITCHES.push([20 - t, 21 + t, 0.82]);
      if (t > 0) STITCHES.push([20 + t, 21 + t, 0.82]);
    }

    // Diamond — lattice diamond above band, top at (20,13), widest (5 wide) at y=17
    [
      [20,13],
      [19,14],[21,14],
      [18,15],[20,15],[22,15],
      [17,16],[19,16],[21,16],[23,16],
      [16,17],[18,17],[20,17],[22,17],[24,17],
      [17,18],[19,18],[21,18],[23,18],
      [18,19],[20,19],[22,19],
    ].forEach(([x,y]) => STITCHES.push([x, y, 0.74]));

    // I-beams — short vertical bars with top/bottom brackets, flanking diamond
    // Left at x=12, right at x=28
    for (let y = 14; y <= 17; y++) { STITCHES.push([12, y, 0.64]); STITCHES.push([28, y, 0.64]); }
    [[11,14],[13,14],[11,17],[13,17],[27,14],[29,14],[27,17],[29,17]]
      .forEach(([x,y]) => STITCHES.push([x, y, 0.58]));

    // Inner trees — cypress-style, branches widen downward
    // Center-top: stem x=20, y=5..9; branches at y=7,8,9
    for (let y = 5; y <= 9; y++) STITCHES.push([20, y, 0.72]);
    [[19,7],[21,7],[18,8],[22,8],[17,9],[23,9]]
      .forEach(([x,y]) => STITCHES.push([x, y, 0.66]));
    // Left of center: stem x=7, y=15..19; branches at y=17,18
    for (let y = 15; y <= 19; y++) STITCHES.push([7, y, 0.72]);
    [[6,17],[8,17],[5,18],[9,18]]
      .forEach(([x,y]) => STITCHES.push([x, y, 0.66]));
    // Right of center: stem x=33, y=15..19; branches at y=17,18
    for (let y = 15; y <= 19; y++) STITCHES.push([33, y, 0.72]);
    [[32,17],[34,17],[31,18],[35,18]]
      .forEach(([x,y]) => STITCHES.push([x, y, 0.66]));
    // Center-bottom (below band): stem x=20, y=26..30; branches at y=28,29,30
    for (let y = 26; y <= 30; y++) STITCHES.push([20, y, 0.72]);
    [[19,28],[21,28],[18,29],[22,29],[17,30],[23,30]]
      .forEach(([x,y]) => STITCHES.push([x, y, 0.66]));

    // V arms — three upward chevrons: center + two edge accents
    // Center chevron: \ from (12,22)→(17,27), dip, / from (23,27)→(28,22)
    // Edge left:  V apex at (4,21); edge right: V apex at (35,21)
    [
      [12,22],[13,23],[14,24],[15,25],[16,26],[17,27],
      [18,26],[19,25],[21,25],[22,26],
      [23,27],[24,26],[25,25],[26,24],[27,23],[28,22],
      [0,25],[1,24],[2,23],[3,22],[4,21],[5,22],[6,23],[7,24],[8,25],
      [31,25],[32,24],[33,23],[34,22],[35,21],[36,22],[37,23],[38,24],[39,25],
    ].forEach(([x,y]) => STITCHES.push([x, y, 0.74]));

    // Tile the canvas with half-stagger on odd rows
    for (let col = -1; col * tileW < W + tileW; col++) {
      for (let row = -1; row * tileH < H + tileH; row++) {
        const ox    = col * tileW + ((row + 20) % 2 === 1 ? tileW * 0.5 : 0);
        const oy    = row * tileH;
        const color = colours[(col * 5 + row * 7) % colours.length];
        const dBase = Math.random() * 160;
        for (const [sx, sy, a] of STITCHES) {
          xc(ox + sx * SC, oy + sy * SC, color, dBase + (sx + sy) * 1.8, a);
        }
      }
    }

    return motifs;
  }

  let motifs    = buildMotifs();
  let startTime = null;
  const FADE_SPEED = 0.016;

  const initW = W, initH = H;
  requestAnimationFrame(() => {
    const realW = canvas.offsetWidth  || window.innerWidth;
    const realH = canvas.offsetHeight || window.innerHeight;
    if (realW !== initW || realH !== initH) {
      W = canvas.width  = realW;
      H = canvas.height = realH;
      motifs = buildMotifs();
    }
  });

  const clearR2 = opts && opts.clearR ? opts.clearR * opts.clearR : 0;

  function render(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    ctx.clearRect(0, 0, W, H);
    const cx0 = W / 2, cy0 = H / 2;
    for (const m of motifs) {
      if (clearR2 > 0) {
        const dx = m.x - cx0, dy = m.y - cy0;
        if (dx * dx + dy * dy < clearR2) continue;
      }
      if (elapsed < m.delay) continue;
      if (m.alpha < m.targetAlpha) m.alpha = Math.min(m.targetAlpha, m.alpha + FADE_SPEED);
      if (m.alpha <= 0) continue;
      if      (m.kind === 'shamse')  drawShamse (m.x, m.y, m.r,    m.color, m.alpha);
      else if (m.kind === 'cross')   drawCross  (m.x, m.y, m.size, m.color, m.alpha);
      else if (m.kind === 'diamond') drawDiamond(m.x, m.y, m.size, m.color, m.alpha);
    }
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

initTatreezCanvas('tatreez-canvas');
initTatreezCanvas('insta-tatreez-canvas');
initTatreezCanvas('loading-tatreez-canvas', { clearR: 80 });

// ── Size guide modal ──────────────────────────────────────────────────────
(function initSizeGuide() {
  const modal   = document.getElementById('size-guide-modal');
  const btnClose = modal.querySelector('.sg-close');

  function openSG()  { modal.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function closeSG() { modal.classList.remove('open'); document.body.style.overflow = ''; }

  document.querySelectorAll('.size-guide-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); openSG(); });
  });

  btnClose.addEventListener('click', closeSG);
  modal.addEventListener('click', e => { if (e.target === modal) closeSG(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeSG(); });
})();

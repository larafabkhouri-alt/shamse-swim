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
    'rgba(255,232,124,1)',
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
    const tileW  = 155;
    const tileH  = 210;

    function xc(x, y, color, delay, alpha = 0.88) {
      motifs.push({ kind: 'cross', x, y, size: 4.5, color, delay, alpha: 0, targetAlpha: alpha });
    }
    function dm(x, y, sz, color, delay, alpha = 0.78) {
      motifs.push({ kind: 'diamond', x, y, size: sz, color, delay, alpha: 0, targetAlpha: alpha });
    }

    // ── Pattern A helpers ─────────────────────────────────────────────────

    function tree(bx, by, color, d) {
      const sp = 11;
      for (let i = 0; i <= 7; i++) xc(bx, by - i * sp, color, d + i * 13);
      for (let b = 1; b <= 4; b++) {
        xc(bx + b * sp, by - sp,      color, d + 38 + b * 9, 0.84);
        xc(bx - b * sp, by - sp,      color, d + 38 + b * 9, 0.84);
      }
      xc(bx + sp * 4.7, by + sp * 0.4, color, d + 82, 0.66);
      xc(bx - sp * 4.7, by + sp * 0.4, color, d + 82, 0.66);
      for (let b = 1; b <= 3; b++) {
        xc(bx + b * sp, by - sp * 3.6, color, d + 54 + b * 9, 0.84);
        xc(bx - b * sp, by - sp * 3.6, color, d + 54 + b * 9, 0.84);
      }
      xc(bx + sp * 3.6, by - sp * 2.9, color, d + 98,  0.66);
      xc(bx - sp * 3.6, by - sp * 2.9, color, d + 98,  0.66);
      for (let b = 1; b <= 2; b++) {
        xc(bx + b * sp, by - sp * 6.1, color, d + 68 + b * 9, 0.84);
        xc(bx - b * sp, by - sp * 6.1, color, d + 68 + b * 9, 0.84);
      }
      xc(bx - sp * 0.8, by - sp * 7.3, color, d + 108, 0.78);
      xc(bx + sp * 0.8, by - sp * 7.3, color, d + 108, 0.78);
      xc(bx,            by - sp * 8.1, color, d + 118, 0.78);
    }

    function invertedTree(tx, ty, color, d) {
      const sp = 10;
      xc(tx - sp * 0.8, ty,           color, d +  5, 0.72);
      xc(tx + sp * 0.8, ty,           color, d +  5, 0.72);
      xc(tx,            ty + sp,      color, d + 14, 0.74);
      for (let b = 1; b <= 2; b++) {
        xc(tx + b * sp, ty + sp * 2.2, color, d + 28 + b * 8, 0.72);
        xc(tx - b * sp, ty + sp * 2.2, color, d + 28 + b * 8, 0.72);
      }
      for (let b = 1; b <= 3; b++) {
        xc(tx + b * sp, ty + sp * 4,   color, d + 48 + b * 8, 0.72);
        xc(tx - b * sp, ty + sp * 4,   color, d + 48 + b * 8, 0.72);
      }
      for (let i = 2; i <= 4; i++) xc(tx, ty + sp * i, color, d + i * 11, 0.76);
    }

    function triangleArch(ax, ay, color, d) {
      const sp = 11, rows = 8;
      for (let r = 0; r <= rows; r++) {
        const y = ay + r * sp * 1.1, spread = r * sp;
        xc(ax - spread, y, color, d + r * 14, 0.88);
        if (r > 0) xc(ax + spread, y, color, d + r * 14, 0.88);
        if (r === rows) {
          for (let f = -(rows - 1); f < rows; f++)
            if (f !== 0) xc(ax + f * sp, y, color, d + rows * 14 + Math.abs(f) * 5, 0.78);
        }
      }
      dm(ax, ay + rows * sp * 0.55, 11, color, d + 88, 0.76);
      dm(ax, ay + rows * sp * 0.55,  6, color, d + 98, 0.70);
      xc(ax, ay + rows * sp * 0.3,  color, d + 68, 0.76);
    }

    function sideBracket(bx, by, dir, color, d) {
      const sp = 11;
      for (let i = 0; i < 4; i++) xc(bx, by + i * sp, color, d + i * 12, 0.72);
      xc(bx + dir * sp,     by,          color, d + 24, 0.66);
      xc(bx + dir * sp,     by + sp * 3, color, d + 34, 0.66);
      xc(bx + dir * sp * 2, by + sp,     color, d + 44, 0.60);
      xc(bx + dir * sp * 2, by + sp * 2, color, d + 49, 0.60);
    }

    // ── Pattern B helpers ─────────────────────────────────────────────────

    // Wide convex arch with upward central fork at the top
    function crownArch(cx, cy, color, d) {
      const sp = 11;
      xc(cx,            cy,           color, d,      0.82);
      xc(cx - sp * 0.8, cy + sp,      color, d +  8, 0.76);
      xc(cx + sp * 0.8, cy + sp,      color, d +  8, 0.76);
      xc(cx,            cy + sp * 1.8, color, d + 14, 0.82);
      for (let i = 1; i <= 5; i++) {
        const sag = Math.pow(i / 5, 2) * sp * 1.2;
        xc(cx + i * sp * 1.2, cy + sp * 2.2 + sag, color, d + 18 + i * 10, 0.74);
        xc(cx - i * sp * 1.2, cy + sp * 2.2 + sag, color, d + 18 + i * 10, 0.74);
      }
      for (let k = 0; k < 3; k++) {
        xc(cx + sp * (6.4 + k * 0.9), cy + sp * (3.0 + k * 0.8), color, d + 72 + k * 9, 0.62);
        xc(cx - sp * (6.4 + k * 0.9), cy + sp * (3.0 + k * 0.8), color, d + 72 + k * 9, 0.62);
      }
    }

    // Large downward-pointing V (two diagonal lines from wide top to apex)
    function largeDownV(cx, cy, color, d) {
      const sp    = 11;
      const rows  = 8;
      const halfW = sp * 5;
      for (let r = 0; r <= rows; r++) {
        const y      = cy + r * sp * 1.3;
        const spread = Math.round(halfW * (rows - r) / rows / sp) * sp;
        xc(cx - spread, y, color, d + r * 12, 0.86);
        if (spread >= sp) xc(cx + spread, y, color, d + r * 12, 0.86);
      }
      // Hanging small tree / pendant from apex
      const tipY = cy + rows * sp * 1.3;
      xc(cx, tipY + sp,      color, d + 120, 0.72);
      xc(cx, tipY + sp * 2,  color, d + 128, 0.72);
      for (let b = 1; b <= 2; b++) {
        xc(cx + b * sp, tipY + sp * 1.5, color, d + 132 + b * 8, 0.66);
        xc(cx - b * sp, tipY + sp * 1.5, color, d + 132 + b * 8, 0.66);
      }
    }

    // Tall I-beam side column
    function iBeamColumn(cx, cy, dir, color, d) {
      const sp = 11;
      for (let i = 0; i < 7; i++) xc(cx, cy + i * sp, color, d + i * 10, 0.68);
      for (let j = 1; j <= 3; j++) {
        xc(cx + dir * j * sp, cy,          color, d + j * 8 + 20, 0.60);
        xc(cx + dir * j * sp, cy + sp * 6, color, d + j * 8 + 28, 0.60);
      }
      for (let j = 1; j <= 2; j++) {
        xc(cx + dir * j * sp, cy + sp * 3, color, d + j * 8 + 36, 0.54);
      }
    }

    // Curved bracket drooping below the V apex
    function curvedBracket(cx, cy, color, d) {
      const sp = 11;
      for (let i = -3; i <= 3; i++) xc(cx + i * sp, cy, color, d + Math.abs(i) * 6, 0.70);
      for (let i = 1; i <= 3; i++) {
        xc(cx + i * sp * 1.1, cy + sp * i * 0.55, color, d + 38 + i * 9, 0.64);
        xc(cx - i * sp * 1.1, cy + sp * i * 0.55, color, d + 38 + i * 9, 0.64);
      }
      xc(cx + sp * 3.6, cy + sp * 2,   color, d + 72, 0.56);
      xc(cx - sp * 3.6, cy + sp * 2,   color, d + 72, 0.56);
    }

    // Small downward fork at very bottom of tile B
    function smallFork(cx, cy, color, d) {
      const sp = 11;
      xc(cx,            cy,           color, d,      0.70);
      xc(cx,            cy + sp,      color, d +  8, 0.70);
      xc(cx - sp * 0.8, cy + sp * 1.8, color, d + 15, 0.64);
      xc(cx + sp * 0.8, cy + sp * 1.8, color, d + 15, 0.64);
      xc(cx - sp * 1.7, cy + sp * 2.5, color, d + 22, 0.58);
      xc(cx + sp * 1.7, cy + sp * 2.5, color, d + 22, 0.58);
    }

    // Full-width border row
    function borderLine(y, color, d) {
      const sp = 22;
      for (let x = -60; x < W + 100; x += sp)
        xc(x, y, color, d + Math.max(0, x) / sp * 6, 0.66);
    }

    // ── Tile assembly ─────────────────────────────────────────────────────

    function tileA(cx, cy, c1, c2, d) {
      tree(cx, cy + 95, c1, d);
      triangleArch(cx, cy + 100, c2, d + 25);
      invertedTree(cx, cy + 195, c1, d + 50);
      sideBracket(cx - tileW * 0.38, cy + 85, +1, c2, d + 65);
      sideBracket(cx + tileW * 0.38, cy + 85, -1, c2, d + 65);
    }

    function tileB(cx, cy, c1, c2, d) {
      crownArch(cx, cy + 18, c1, d);
      borderLine(cy + 58, c2, d + 20);
      borderLine(cy + 68, c2, d + 24);
      largeDownV(cx, cy + 75, c2, d + 35);
      dm(cx, cy + 128, 13, c1, d + 65, 0.76);
      dm(cx, cy + 128,  7, c1, d + 75, 0.70);
      iBeamColumn(cx - tileW * 0.44, cy + 70, +1, c2, d + 50);
      iBeamColumn(cx + tileW * 0.44, cy + 70, -1, c2, d + 50);
      curvedBracket(cx, cy + 162, c1, d + 85);
      smallFork(cx, cy + 182, c2, d + 105);
    }

    for (let col = -1; col * tileW < W + tileW; col++) {
      for (let row = -1; row * tileH < H + tileH; row++) {
        const cx  = col * tileW;
        const cy  = row * tileH;
        const c1  = colours[((col + 20) * 2 + (row + 20))          % colours.length];
        const c2  = colours[((col + 20) * 3 + (row + 20) * 2 + 1)  % colours.length];
        const d   = Math.random() * 220;
        if ((row + 20) % 2 === 0) tileA(cx, cy, c1, c2, d);
        else                      tileB(cx, cy, c1, c2, d);
      }
    }

    // Single border band between A rows (at A tile bottom)
    for (let row = 0; row * tileH < H + tileH * 2; row++) {
      if ((row + 20) % 2 === 0)
        borderLine(row * tileH + 192, colours[row % colours.length], row * 22);
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

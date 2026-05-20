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
function initTatreezCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
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
    // 16 wavy rays matching the new organic sun design
    const rInner = r * 0.38;
    const rOuter = r;
    const dx     = r * 0.11;
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i / 16) - Math.PI / 2;
      const cos   = Math.cos(angle);
      const sin   = Math.sin(angle);
      // rotate base points and control points around center
      function pt(dr, dt) {
        const a = angle + dt;
        return [x + dr * Math.cos(a), y + dr * Math.sin(a)];
      }
      const [bx1, by1] = pt(rInner, 0.12);
      const [bx2, by2] = pt(rInner, -0.12);
      const [tx,  ty]  = [x + rOuter * cos, y + rOuter * sin];
      const [c1x, c1y] = pt(rInner * 1.6, 0.18);
      const [c2x, c2y] = pt(rOuter * 0.75, 0.06);
      const [c3x, c3y] = pt(rOuter * 0.75, -0.06);
      const [c4x, c4y] = pt(rInner * 1.6, -0.18);
      ctx.beginPath();
      ctx.moveTo(bx1, by1);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty);
      ctx.bezierCurveTo(c3x, c3y, c4x, c4y, bx2, by2);
      ctx.closePath();
      ctx.fill();
    }
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
    const motifs  = [];
    const colStep = 88;
    const rowStep = 78;

    for (let col = 0; col * colStep < W + colStep * 2; col++) {
      for (let row = 0; row * rowStep < H + rowStep * 2; row++) {
        const x     = col * colStep + (row % 2) * 44 - 20;
        const y     = row * rowStep - 20;
        const type  = (col + row * 2) % 6;
        const color = colours[(col * 3 + row * 2) % colours.length];
        const delay = Math.random() * 300;

        if (type === 0) {
          motifs.push({ kind: 'shamse', x, y, r: 18, color, delay, alpha: 0, targetAlpha: 0.75 });
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            motifs.push({
              kind: 'cross', x: x + 30 * Math.cos(a), y: y + 30 * Math.sin(a),
              size: 5, color, delay: delay + k * 14, alpha: 0, targetAlpha: 0.55,
            });
          }
        } else if (type === 1 || type === 4) {
          motifs.push({ kind: 'diamond', x, y, size: 18, color, delay, alpha: 0, targetAlpha: 0.55 });
          motifs.push({ kind: 'diamond', x, y, size: 10, color, delay: delay + 20, alpha: 0, targetAlpha: 0.45 });
        } else {
          for (let di = 0; di < 3; di++) {
            for (let dj = 0; dj < 3; dj++) {
              motifs.push({
                kind: 'cross',
                x: x + di * 16 - 16,
                y: y + dj * 16 - 16,
                size: 5, color,
                delay: delay + (di + dj) * 18,
                alpha: 0, targetAlpha: 0.5,
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
  const FADE_SPEED = 0.016;

  function render(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    ctx.clearRect(0, 0, W, H);
    for (const m of motifs) {
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

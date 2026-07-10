// ===== CONFIG =====
const API_BASE = 'http://localhost:3000/api';

// ===== CATEGORY STRUCTURE =====
const MAIN_CATEGORIES = [
  { name: 'Accessories', image: 'https://i.pinimg.com/736x/c5/01/ac/c501ac1b5cb023679ed93ae6f381db8b.jpg' },
  { name: 'Sweaters', image: 'https://i.pinimg.com/736x/92/9f/a8/929fa877d2453d38cbf1642764cabcba.jpg' },
  { name: 'Mugs', image: 'https://i.pinimg.com/736x/7b/35/1d/7b351d7374cbb1484b84a3afecfe0a18.jpg' },
  { name: 'Watches', image: 'https://i.pinimg.com/736x/f0/f8/6b/f0f86b3fc8124efb5ec40f86e5b6475e.jpg' },
  { name: 'Candles', image: 'https://i.pinimg.com/736x/bf/7e/40/bf7e4016b2af68abe3b266d3f85aa477.jpg' },
  { name: 'Bags', image: 'https://i.pinimg.com/736x/59/69/30/596930f27e6569485cfc572218f7dd74.jpg' }
];
const SUB_CATEGORIES = {
  Accessories: [
    { name: 'Rings', image: 'https://i.pinimg.com/736x/8b/a4/c9/8ba4c974618f7ad83d9de4502ae68072.jpg' },
    { name: 'Bracelets', image: 'https://i.pinimg.com/736x/af/90/8f/af908ff844ae6d52ddf292c836fb29db.jpg' },
    { name: 'Earrings', image: 'https://i.pinimg.com/736x/ef/dc/d2/efdcd2e1f576b13cbb48617178ad407f.jpg' },
    { name: 'Chains & Necklaces', image: 'https://i.pinimg.com/736x/0f/9f/77/0f9f773baea0dfdea26d82a43d3ba35b.jpg' }
  ]
};

// ===== HELPERS =====
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = totalQty);
}

function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'));
}

// ===== NAVBAR AUTH AREA =====
function renderNavAuth() {
  const authArea = document.getElementById('nav-auth-area');
  if (!authArea) return;

  const user = getUser();
  if (user) {
    authArea.innerHTML = `
      <span class="nav-user">Hi, ${user.name.split(' ')[0]}</span>
      <button class="nav-logout-btn" id="logout-btn">Logout</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    });
  } else {
    authArea.innerHTML = `<a href="login.html">Login</a>`;
  }
}

// ===== HOME PAGE: CATEGORY NAVIGATION =====
function renderBreadcrumb(parts) {
  const grid = document.getElementById('product-grid');
  const existing = document.getElementById('breadcrumb');
  if (existing) existing.remove();

  const crumb = document.createElement('div');
  crumb.id = 'breadcrumb';
  crumb.className = 'breadcrumb';
  crumb.innerHTML = parts.map(p =>
    p.url ? `<a href="${p.url}">${p.label}</a>` : `<span>${p.label}</span>`
  ).join(' <span class="crumb-sep">›</span> ');

  grid.parentNode.insertBefore(crumb, grid);
}

function renderCategoryGrid(items, onClickUrlFn) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = items.map(item => `
    <div class="product-card" onclick="window.location.href='${onClickUrlFn(item)}'">
      <img src="${item.image}" alt="${item.name}">
      <div class="product-card-body">
        <h3>${item.name}</h3>
      </div>
    </div>
  `).join('');
}

async function renderProductGrid(mainCategory, subCategory) {
  const grid = document.getElementById('product-grid');
  try {
    let url = `${API_BASE}/products?mainCategory=${encodeURIComponent(mainCategory)}`;
    if (subCategory) url += `&subCategory=${encodeURIComponent(subCategory)}`;

    const res = await fetch(url);
    const products = await res.json();

    if (products.length === 0) {
      grid.innerHTML = `<p>No products found in this category.</p>`;
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
        <img src="${p.image}" alt="${p.name}">
        <div class="product-card-body">
          <h3>${p.name}</h3>
          <div class="price">Rs. ${p.price}</div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<p>Could not load products. Make sure the server is running.</p>`;
  }
}

function loadProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const sub = params.get('sub');

  // LEVEL 1: no category -> show main categories (Accessories, Sweaters, Mugs)
  if (!category) {
    const existing = document.getElementById('breadcrumb');
    if (existing) existing.remove();
    renderCategoryGrid(MAIN_CATEGORIES, (item) => `index.html?category=${encodeURIComponent(item.name)}`);
    return;
  }

  // LEVEL 2: Accessories without sub -> show subcategories (Rings, Bracelets, Earrings, Chains & Necklaces)
  if (category === 'Accessories' && !sub) {
    renderBreadcrumb([
      { label: 'Home', url: 'index.html' },
      { label: 'Accessories' }
    ]);
    renderCategoryGrid(SUB_CATEGORIES.Accessories, (item) =>
      `index.html?category=Accessories&sub=${encodeURIComponent(item.name)}`
    );
    return;
  }

  // LEVEL 3: Accessories + sub -> show actual products with price
  if (category === 'Accessories' && sub) {
    renderBreadcrumb([
      { label: 'Home', url: 'index.html' },
      { label: 'Accessories', url: 'index.html?category=Accessories' },
      { label: sub }
    ]);
    renderProductGrid('Accessories', sub);
    return;
  }

  // LEVEL 2 (direct, no subcategory): Sweaters / Mugs -> show products directly
  renderBreadcrumb([
    { label: 'Home', url: 'index.html' },
    { label: category }
  ]);
  renderProductGrid(category, null);
}

// ===== PRODUCT DETAIL PAGE =====
let currentQty = 1;

async function loadProductDetail() {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const id = getProductIdFromURL();
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Not found');
    const p = await res.json();

    container.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="product-detail-info">
        <span class="product-category">${p.subCategory || p.mainCategory}</span>
        <h2>${p.name}</h2>
        <p class="description">${p.description}</p>
        <div class="price">Rs. ${p.price}</div>
        <p class="stock-info">${p.stock > 0 ? `✔ In stock (${p.stock} available)` : '✘ Out of stock'}</p>
        <div class="qty-selector">
          <button id="qty-minus">−</button>
          <span id="qty-value">1</span>
          <button id="qty-plus">+</button>
        </div>
        <button class="btn btn-primary" id="add-to-cart-btn" ${p.stock === 0 ? 'disabled' : ''}>Add to Cart</button>
      </div>
    `;

    currentQty = 1;
    document.getElementById('qty-minus').addEventListener('click', () => {
      if (currentQty > 1) currentQty--;
      document.getElementById('qty-value').textContent = currentQty;
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      if (currentQty < p.stock) currentQty++;
      document.getElementById('qty-value').textContent = currentQty;
    });
    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
      addToCart(p, currentQty);
    });

  } catch (err) {
    container.innerHTML = `<p>Product not found.</p>`;
  }
}

function addToCart(product, qty) {
  let cart = getCart();
  const existing = cart.find(item => item.productId === product.id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: qty
    });
  }

  saveCart(cart);
  alert(`${product.name} added to cart! 🛒`);
}

// ===== CART PAGE =====
function renderCart() {
  const container = document.getElementById('cart-items');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `<div class="empty-cart"><p>Your cart is empty 🌸</p></div>`;
    document.getElementById('cart-total').textContent = '0';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <div class="price">Rs. ${item.price} x ${item.qty} = Rs. ${item.price * item.qty}</div>
      </div>
      <div class="cart-item-qty">
        <button onclick="changeQty(${item.productId}, -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${item.productId}, 1)">+</button>
      </div>
      <button class="btn btn-danger" onclick="removeFromCart(${item.productId})">Remove</button>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  document.getElementById('cart-total').textContent = total;
}

function changeQty(productId, delta) {
  let cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.productId !== productId);
    }
  }
  saveCart(cart);
  renderCart();
}

function removeFromCart(productId) {
  let cart = getCart().filter(i => i.productId !== productId);
  saveCart(cart);
  renderCart();
}

async function checkout() {
  const token = getToken();
  if (!token) {
    alert('Please login to place an order.');
    window.location.href = 'login.html';
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  const items = cart.map(item => ({ productId: item.productId, qty: item.qty }));

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Something went wrong.');
      return;
    }

    alert('Order placed successfully! 🎉');
    localStorage.removeItem('cart');
    updateCartCount();
    renderCart();

  } catch (err) {
    alert('Could not connect to server.');
  }
}

// ===== LOGIN =====
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const msgEl = document.getElementById('login-message');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data.message;
      msgEl.className = 'form-message error';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    msgEl.textContent = 'Login successful! Redirecting...';
    msgEl.className = 'form-message success';

    setTimeout(() => window.location.href = 'index.html', 1000);

  } catch (err) {
    msgEl.textContent = 'Could not connect to server.';
    msgEl.className = 'form-message error';
  }
}

// ===== REGISTER =====
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const msgEl = document.getElementById('register-message');

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data.message;
      msgEl.className = 'form-message error';
      return;
    }

    msgEl.textContent = 'Account created! Redirecting to login...';
    msgEl.className = 'form-message success';

    setTimeout(() => window.location.href = 'login.html', 1200);

  } catch (err) {
    msgEl.textContent = 'Could not connect to server.';
    msgEl.className = 'form-message error';
  }
}

// ===== INIT (runs on every page) =====
document.addEventListener('DOMContentLoaded', () => {
  renderNavAuth();
  updateCartCount();

  loadProducts();
  loadProductDetail();
  renderCart();

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
});
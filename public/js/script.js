// ============================================================
// DUMSEL MERCHANTS — script.js
// ============================================================

const defaultProducts = [
    { id: 1, name: 'Product 1', price: 1000.00, description: 'Description for product 1', image: 'images/product 1.png' },
    { id: 2, name: 'Product 2', price: 39.99,   description: 'Description for product 2', image: 'images/product 2.jpg' },
    { id: 3, name: 'Product 3', price: 49.99,   description: 'Description for product 3', image: 'images/product 3.jpg' },
    { id: 4, name: 'Product 4', price: 19.99,   description: 'Description for product 4', image: 'images/product 4.png' },
    { id: 5, name: 'Product 5', price: 59.99,   description: 'Description for product 5', image: 'images/product 5.jpg' },
    { id: 6, name: 'Product 6', price: 24.99,   description: 'Description for product 6', image: 'images/product 6.png' }
];

let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentPaymentMethod = 'mpesa';

// ============================================================
// AUTH HELPERS
// ============================================================

function isLoggedIn() {
    return !!localStorage.getItem('dumsel_user');
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('dumsel_user')); }
    catch { return null; }
}

function saveUser(user) {
    localStorage.setItem('dumsel_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('dumsel_user');
    window.location.href = 'login.html';
}

// Pages that require login
const protectedPages = ['products.html', 'checkout.html'];
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

// Redirect to register if not logged in and trying to access protected page
if (protectedPages.includes(currentPage) && !isLoggedIn()) {
    window.location.href = 'register.html';
}

// Redirect already-logged-in users away from login/register
if ((currentPage === 'login.html' || currentPage === 'register.html') && isLoggedIn()) {
    window.location.href = 'products.html';
}

// ============================================================
// DARK MODE
// ============================================================

const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        darkModeToggle.innerHTML = document.body.classList.contains('dark-mode')
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    });
}
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// ============================================================
// MOBILE MENU
// ============================================================

const menuToggle = document.querySelector('.menu-toggle');
const navUl = document.querySelector('nav ul');
if (menuToggle) {
    menuToggle.addEventListener('click', () => navUl.classList.toggle('active'));
}

// Update nav auth link
const navAuthLink = document.getElementById('nav-auth-link');
if (navAuthLink) {
    if (isLoggedIn()) {
        const user = getUser();
        navAuthLink.innerHTML = `
            <a href="#" onclick="logout()" title="Logout ${user?.username || ''}">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>`;
    }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const icon = toast.querySelector('i');
    const msg = document.getElementById('toast-message');
    if (icon) icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    if (msg) msg.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// CART
// ============================================================

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
}

function updateCart() {
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const cartTotal = document.querySelector('.cart-total');

    let total = 0;

    // For checkout page (uses old selectors)
    if (cartTotal && !cartTotalAmount) {
        const cartItems = document.querySelector('.cart-items');
        if (cartItems) {
            cartItems.innerHTML = '';
            cart.forEach(item => {
                const el = document.createElement('div');
                el.className = 'cart-item';
                el.innerHTML = `<span>${item.name} (x${item.quantity})</span><span>KSh ${(item.price * item.quantity).toFixed(2)}</span>`;
                cartItems.appendChild(el);
                total += item.price * item.quantity;
            });
        }
        cartTotal.textContent = `Total: KSh ${total.toFixed(2)}`;
        return;
    }

    // For products page (new cart sidebar)
    if (!cartItemsList) return;

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <span>Add some products to get started!</span>
            </div>`;
    } else {
        cartItemsList.innerHTML = '';
        cart.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item-row';
            el.innerHTML = `
                <div class="cart-item-img">
                    <img src="${item.image || 'images/placeholder.png'}" alt="${item.name}" onerror="this.src='images/product 1.png'">
                </div>
                <div class="cart-item-info">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">KSh ${item.price.toFixed(2)}</p>
                    <div class="cart-item-qty">
                        <button onclick="changeQty(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQty(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>`;
            cartItemsList.appendChild(el);
            total += item.price * item.quantity;
        });
    }

    if (cartTotalAmount) cartTotalAmount.textContent = `KSh ${total.toFixed(2)}`;
    updateCartBadge();
}

function addToCart(product) {
    if (!product) return;
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCart();
    showToast(`${product.name} added to cart!`);

    // Open cart briefly
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar) {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('show');
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCart();
    showToast('Item removed from cart', 'error');
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) return removeFromCart(id);
    saveCart();
    updateCart();
}

// Cart toggle
const cartToggle = document.getElementById('cart-toggle');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartClose = document.getElementById('cart-close');
const clearCartBtn = document.getElementById('clear-cart');

if (cartToggle) {
    cartToggle.addEventListener('click', () => {
        cartSidebar.classList.toggle('open');
        cartOverlay.classList.toggle('show');
    });
}
if (cartClose) {
    cartClose.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('show');
    });
}
if (cartOverlay) {
    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('show');
    });
}
if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        if (confirm('Clear all items from cart?')) {
            cart = [];
            saveCart();
            updateCart();
            showToast('Cart cleared', 'error');
        }
    });
}

// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {
    const productGrid = document.getElementById('products-grid') || document.querySelector('.products-grid');
    if (!productGrid) return;

    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('API error');
        products = await response.json();
    } catch (error) {
        console.warn('Using local product data:', error);
        products = defaultProducts;
    }

    productGrid.innerHTML = '';

    if (products.length === 0) {
        productGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>No products available yet.</p>
                <span>Check back soon!</span>
            </div>`;
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrap">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='images/product 1.png'">
                <div class="product-overlay">
                    <button class="quick-add btn" data-id="${product.id}">
                        <i class="fas fa-cart-plus"></i> Quick Add
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-footer">
                    <span class="price">KSh ${Number(product.price).toFixed(2)}</span>
                    <button class="btn add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>`;
        productGrid.appendChild(card);
    });
}

// Product search
const searchInput = document.getElementById('product-search');
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        document.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = name.includes(q) ? '' : 'none';
        });
    });
}

// Add to cart click delegation
document.addEventListener('click', e => {
    if (e.target.closest('.add-to-cart') || e.target.closest('.quick-add')) {
        const btn = e.target.closest('[data-id]');
        if (!btn) return;
        const productId = Number(btn.dataset.id);
        const product = products.find(p => p.id === productId);
        addToCart(product);
    }
});

// ============================================================
// REGISTER FORM
// ============================================================

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');
        const btn = document.getElementById('register-btn');

        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match.';
            errorDiv.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const result = await response.json();

            if (!response.ok) {
                errorDiv.textContent = result.message || 'Registration failed.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-text">Create Account</span><i class="fas fa-arrow-right"></i>';
                return;
            }

            successDiv.textContent = 'Account created! Redirecting to login...';
            successDiv.style.display = 'block';
            saveUser(result.user);
            setTimeout(() => window.location.href = 'login.html', 1500);

        } catch (err) {
            errorDiv.textContent = 'Network error. Please try again.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-text">Create Account</span><i class="fas fa-arrow-right"></i>';
        }
    });
}

// ============================================================
// LOGIN FORM
// ============================================================

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        const btn = document.getElementById('login-btn');

        errorDiv.style.display = 'none';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();

            if (!response.ok) {
                errorDiv.textContent = result.message || 'Invalid username or password.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-text">Sign In</span><i class="fas fa-arrow-right"></i>';
                return;
            }

            saveUser(result.user);
            window.location.href = 'products.html';

        } catch (err) {
            errorDiv.textContent = 'Network error. Please try again.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-text">Sign In</span><i class="fas fa-arrow-right"></i>';
        }
    });
}

// ============================================================
// CONTACT FORM
// ============================================================

const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });
            const result = await response.json();
            if (!response.ok) return alert(result.error || 'Unable to send message');
            alert('Message sent! We will get back to you soon.');
            contactForm.reset();
        } catch (err) {
            alert('Unable to send message. Please try again.');
        }
    });
}

// ============================================================
// CHECKOUT FORM
// ============================================================

const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (cart.length === 0) return alert('Your cart is empty. Add products before checkout.');
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const zip = document.getElementById('zip').value.trim();
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, address, city, zip, paymentMethod: currentPaymentMethod, items: cart })
            });
            const result = await response.json();
            if (!response.ok) return alert(result.error || 'Unable to place order');
            alert('Order placed successfully!');
            cart = [];
            saveCart();
            window.location.href = 'index.html';
        } catch (err) {
            alert('Unable to place order. Please try again.');
        }
    });
}

// ============================================================
// NEWSLETTER
// ============================================================

const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
        e.preventDefault();
        alert('Thank you for subscribing!');
        newsletterForm.reset();
    });
}

// ============================================================
// ADMIN STATS
// ============================================================

async function loadAdminStats() {
    const totalProducts = document.getElementById('total-products');
    const totalOrders = document.getElementById('total-orders');
    const totalUsers = document.getElementById('total-users');
    if (!totalProducts) return;
    try {
        const response = await fetch('/api/admin/stats');
        const result = await response.json();
        totalProducts.textContent = result.products;
        totalOrders.textContent = result.orders;
        totalUsers.textContent = result.users;
    } catch (err) {
        if (totalProducts) totalProducts.textContent = 'N/A';
        if (totalOrders) totalOrders.textContent = 'N/A';
        if (totalUsers) totalUsers.textContent = 'N/A';
    }
}

// ============================================================
// PAYMENT SELECTION
// ============================================================

function setPaymentMethod(method) { currentPaymentMethod = method; }

window.selectPayment = method => {
    setPaymentMethod(method);
    const mpesa = document.getElementById('mpesa-details');
    const paypal = document.getElementById('paypal-details');
    if (mpesa) mpesa.style.display = method === 'mpesa' ? 'block' : 'none';
    if (paypal) paypal.style.display = method === 'paypal' ? 'block' : 'none';
};

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCart();
    updateCartBadge();
    loadAdminStats();
});

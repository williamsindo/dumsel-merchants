const defaultProducts = [
    { id: 1, name: 'Product 1', price: 1000.00, description: 'Description for product 1', image: 'images/product 1.png' },
    { id: 2, name: 'Product 2', price: 39.99, description: 'Description for product 2', image: 'images/product 2.jpg' },
    { id: 3, name: 'Product 3', price: 49.99, description: 'Description for product 3', image: 'images/product 3.jpg' },
    { id: 4, name: 'Product 4', price: 19.99, description: 'Description for product 4', image: 'images/product 4.png' },
    { id: 5, name: 'Product 5', price: 59.99, description: 'Description for product 5', image: 'images/product 5.jpg' },
    { id: 6, name: 'Product 6', price: 24.99, description: 'Description for product 6', image: 'images/product 6.png' }
];

let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentPaymentMethod = 'mpesa';

// ================= DARK MODE =================
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// ================= SMOOTH SCROLL =================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// ================= MOBILE MENU =================
const menuToggle = document.querySelector('.menu-toggle');
const navUl = document.querySelector('nav ul');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navUl.classList.toggle('active');
    });
}

// ================= CART =================
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(product) {
    if (!product) return;

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCart();
}

function updateCart() {
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');

    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        `;
        cartItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

// ================= LOAD PRODUCTS =================
async function loadProducts() {
    const productGrid = document.querySelector('.products-grid');
    if (!productGrid) return;

    productGrid.innerHTML = '';

    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('API failed');
        }

        products = await response.json();
    } catch (error) {
        console.warn('Using fallback products:', error);
        products = defaultProducts;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">$${product.price}</p>
            <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
        `;

        productGrid.appendChild(productCard);
    });
}

// ================= CART BUTTON CLICK =================
document.addEventListener('click', event => {
    if (event.target.classList.contains('add-to-cart')) {
        const productId = Number(event.target.dataset.id);
        const product = products.find(p => p.id === productId);
        addToCart(product);
    }
});

// ================= LOGIN =================
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || 'Login failed');
                return;
            }

            alert('Login successful!');
            window.location.href = 'admin.html';
        } catch (error) {
            console.error('Login error:', error);
            alert('Server error');
        }
    });
}

// ================= CONTACT =================
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

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

            if (!response.ok) {
                alert(result.error || 'Failed to send message');
                return;
            }

            alert('Message sent successfully!');
            contactForm.reset();
        } catch (error) {
            console.error(error);
            alert('Server error');
        }
    });
}

// ================= CHECKOUT =================
const checkoutForm = document.getElementById('checkout-form');

if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const zip = document.getElementById('zip').value.trim();

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    address,
                    city,
                    zip,
                    paymentMethod: currentPaymentMethod,
                    items: cart
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.error || 'Checkout failed');
                return;
            }

            alert('Order placed successfully!');
            cart = [];
            saveCart();
            updateCart();
            window.location.href = 'index.html';
        } catch (error) {
            console.error(error);
            alert('Server error');
        }
    });
}

// ================= NEWSLETTER =================
const newsletterForm = document.getElementById('newsletter-form');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        alert('Subscribed successfully!');
        newsletterForm.reset();
    });
}

// ================= ADMIN STATS =================
async function loadAdminStats() {
    const totalProducts = document.getElementById('total-products');
    const totalOrders = document.getElementById('total-orders');
    const totalUsers = document.getElementById('total-users');

    if (!totalProducts || !totalOrders || !totalUsers) return;

    try {
        const response = await fetch('/api/admin/stats');
        const result = await response.json();

        totalProducts.textContent = result.products;
        totalOrders.textContent = result.orders;
        totalUsers.textContent = result.users;
    } catch (error) {
        console.error(error);
        totalProducts.textContent = 'N/A';
        totalOrders.textContent = 'N/A';
        totalUsers.textContent = 'N/A';
    }
}

async function loadAdminProducts() {
    const adminProductsList = document.getElementById('admin-products-list');
    if (!adminProductsList) return;

    try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) throw new Error('Could not load products');

        const adminProducts = await response.json();
        adminProductsList.innerHTML = '';

        if (adminProducts.length === 0) {
            adminProductsList.innerHTML = '<p>No products yet.</p>';
            return;
        }

        adminProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image || 'images/product 1.png'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description || ''}</p>
                <p class="price">$${Number(product.price).toFixed(2)}</p>
                <button class="btn delete-btn" data-id="${product.id}">Delete</button>
            `;
            adminProductsList.appendChild(productCard);
        });
    } catch (error) {
        console.error('Admin products error:', error);
    }
}

document.addEventListener('click', async event => {
    if (event.target.matches('.delete-btn')) {
        const productId = event.target.dataset.id;
        if (!productId) return;

        if (!confirm('Delete this product?')) return;

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Delete failed');
            }

            alert(result.message || 'Product deleted');
            loadAdminStats();
            loadAdminProducts();
        } catch (error) {
            console.error('Delete error:', error);
            alert(error.message || 'Delete failed');
        }
    }
});

function updateImagePreview(file) {
    const preview = document.getElementById('image-preview');
    if (!preview) return;

    if (!file) {
        preview.innerHTML = 'Select an image to preview';
        return;
    }

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.maxWidth = '100%';
    img.style.maxHeight = '180px';
    img.style.borderRadius = '8px';

    preview.innerHTML = '';
    preview.appendChild(img);
}

async function submitAdminProductForm(form) {
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        alert('Product uploaded successfully');
        form.reset();
        updateImagePreview(null);
        loadAdminStats();
        loadAdminProducts();
    } catch (error) {
        console.error('Upload error:', error);
        alert(error.message || 'Upload failed');
    }
}

const productForm = document.getElementById('product-form');
const imageInput = document.getElementById('image');

if (imageInput) {
    imageInput.addEventListener('change', async () => {
        updateImagePreview(imageInput.files[0]);

        if (productForm && productForm.checkValidity()) {
            await submitAdminProductForm(productForm);
        }
    });
}

if (productForm) {
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await submitAdminProductForm(productForm);
    });
}

// ================= PAYMENT =================
function setPaymentMethod(method) {
    currentPaymentMethod = method;
}

window.selectPayment = function (method) {
    setPaymentMethod(method);

    const mpesa = document.getElementById('mpesa-details');
    const paypal = document.getElementById('paypal-details');

    if (mpesa) mpesa.style.display = method === 'mpesa' ? 'block' : 'none';
    if (paypal) paypal.style.display = method === 'paypal' ? 'block' : 'none';
};

// ================= CART TOGGLE =================
const cartToggle = document.getElementById('cart-toggle');
const cartElement = document.querySelector('.cart');

if (cartToggle && cartElement) {
    cartToggle.addEventListener('click', () => {
        cartElement.classList.toggle('open');
    });
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCart();
    loadAdminStats();
    loadAdminProducts();
});

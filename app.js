// ==== Mock Data Setup ====
const MOCK_PRODUCTS = [
    { id: 'p1', name: 'Fresh Organic Tomatoes', price: 4.99, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80' },
    { id: 'p2', name: 'Green Avocados', price: 6.50, image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80' },
    { id: 'p3', name: 'Organic Bananas (Bunch)', price: 3.20, image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80' },
    { id: 'p4', name: 'Whole Milk 1 Gallon', price: 5.00, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80' },
    { id: 'p5', name: 'Farm Fresh Eggs (Dozen)', price: 4.50, image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=500&q=80' },
    { id: 'p6', name: 'Sourdough Bread', price: 5.99, image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bfc54?w=500&q=80' }
];

// ==== Storage Functions ====
const Storage = {
    get: (key, fallback = []) => JSON.parse(localStorage.getItem(key)) || fallback,
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    init() {
        if (localStorage.getItem('freshcart_init') === null) {
            this.set('users', [
                { id: 'u1', name: 'System Admin', email: 'admin@freshcart.com', password: 'admin', role: 'admin' },
                { id: 'u2', name: 'Test Customer', email: 'customer@example.com', password: 'password', role: 'customer' }
            ]);
            this.set('products', MOCK_PRODUCTS);
            this.set('orders', []);
            this.set('freshcart_init', true);
        }
    }
};

Storage.init();

// ==== Global State ====
let AppState = {
    currentUser: null,
    cart: []
};

// ==== DOM Elements ====
const El = {
    nav: document.getElementById('main-nav'),
    navSearch: document.getElementById('nav-search'),
    navCartBtn: document.getElementById('nav-cart-btn'),
    navAdminBtn: document.getElementById('nav-admin-btn'),
    navLogoutBtn: document.getElementById('nav-logout-btn'),
    cartBadge: document.getElementById('cart-badge'),
    searchInput: document.getElementById('search-input'),
    
    views: {
        login: document.getElementById('login-view'),
        register: document.getElementById('register-view'),
        shop: document.getElementById('shop-view'),
        cart: document.getElementById('cart-view'),
        admin: document.getElementById('admin-view')
    },

    // View toggles
    goRegister: document.getElementById('go-to-register'),
    goLogin: document.getElementById('go-to-login'),
    backToShop: document.getElementById('back-to-shop'),

    // Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    
    // Shop
    productList: document.getElementById('product-list'),

    // Cart
    cartItemsContainer: document.getElementById('cart-items-container'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartTotal: document.getElementById('cart-total'),
    checkoutBtn: document.getElementById('checkout-btn'),

    // Admin
    adminTabs: document.querySelectorAll('.admin-tab'),
    adminTabContents: document.querySelectorAll('.admin-tab-content'),
    adminProductsTable: document.querySelector('#admin-products-table tbody'),
    adminOrdersTable: document.querySelector('#admin-orders-table tbody'),
    adminCustomersTable: document.querySelector('#admin-customers-table tbody'),
    adminAdminsTable: document.querySelector('#admin-admins-table tbody'),
    btnAddProduct: document.getElementById('btn-add-product'),
    btnAddAdmin: document.getElementById('btn-add-admin'),

    // Modal
    productModal: document.getElementById('product-modal'),
    productForm: document.getElementById('product-form'),
    closeModal: document.getElementById('close-modal'),
    adminModal: document.getElementById('admin-modal'),
    adminForm: document.getElementById('admin-form'),
    closeAdminModal: document.getElementById('close-admin-modal')
};

// ==== Utilities ====
const formatPrice = amount => `$${Number(amount).toFixed(2)}`;
const generateId = () => Math.random().toString(36).substr(2, 9);

const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'circle-exclamation'}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ==== Navigation ====
const switchView = (viewName) => {
    Object.values(El.views).forEach(v => {
        v.classList.remove('active-view');
        v.classList.add('hidden');
    });
    El.views[viewName].classList.remove('hidden');
    El.views[viewName].classList.add('active-view');

    // Update Nav visibility
    if (viewName === 'login' || viewName === 'register') {
        El.nav.classList.add('hidden');
    } else {
        El.nav.classList.remove('hidden');
        if (AppState.currentUser.role === 'admin') {
            El.navAdminBtn.classList.remove('hidden');
            El.navCartBtn.classList.add('hidden');
            El.navSearch.classList.add('hidden');
        } else {
            El.navAdminBtn.classList.add('hidden');
            El.navCartBtn.classList.remove('hidden');
            if (viewName === 'shop') El.navSearch.classList.remove('hidden');
            else El.navSearch.classList.add('hidden');
        }
    }
};

// ==== Authentication ====
const handleLogin = (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    
    const users = Storage.get('users');
    const user = users.find(u => u.email === email && u.password === pass);

    if (user) {
        AppState.currentUser = user;
        AppState.cart = [];
        updateCartBadge();
        showToast('Login successful!');
        
        if (user.role === 'admin') {
            switchView('admin');
            renderAdminDashboard();
        } else {
            switchView('shop');
            renderShop();
        }
        e.target.reset();
    } else {
        showToast('Invalid email or password', 'error');
    }
};

const handleRegister = (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value.trim();

    const users = Storage.get('users');
    if (users.find(u => u.email === email)) {
        showToast('Email already in use', 'error');
        return;
    }

    const newUser = { id: generateId(), name, email, password: pass, role: 'customer' };
    Storage.set('users', [...users, newUser]);
    
    AppState.currentUser = newUser;
    showToast('Registration successful!');
    e.target.reset();
    switchView('shop');
    renderShop();
};

const handleLogout = () => {
    AppState.currentUser = null;
    AppState.cart = [];
    switchView('login');
    showToast('Logged out');
};

// ==== Customer Shop ====
const renderShop = (searchTerm = '') => {
    const products = Storage.get('products');
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    El.productList.innerHTML = '';
    
    if (filtered.length === 0) {
        El.productList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No products found matching "${searchTerm}".</div>`;
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">${formatPrice(p.price)}</div>
                <div class="product-actions">
                    <button class="btn btn-outline btn-block add-to-cart-btn" data-id="${p.id}">
                        <i class="fa-solid fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        El.productList.appendChild(card);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => addToCart(btn.dataset.id));
    });
};

const handleSearch = (e) => {
    renderShop(e.target.value);
};

// ==== Cart Logic ====
const updateCartBadge = () => {
    const totalItems = AppState.cart.reduce((sum, item) => sum + item.qty, 0);
    El.cartBadge.textContent = totalItems;
    if (totalItems > 0) {
        El.cartBadge.classList.remove('hidden');
    } else {
        El.cartBadge.classList.add('hidden');
    }
};

const addToCart = (productId) => {
    const product = Storage.get('products').find(p => p.id === productId);
    if (!product) return;

    const existingItem = AppState.cart.find(i => i.id === productId);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        AppState.cart.push({ ...product, qty: 1 });
    }
    
    updateCartBadge();
    showToast(`${product.name} added to cart!`);
};

const updateCartItemQty = (productId, delta) => {
    const itemIndex = AppState.cart.findIndex(i => i.id === productId);
    if (itemIndex > -1) {
        AppState.cart[itemIndex].qty += delta;
        if (AppState.cart[itemIndex].qty <= 0) {
            AppState.cart.splice(itemIndex, 1);
        }
    }
    renderCart();
    updateCartBadge();
};

const renderCart = () => {
    El.cartItemsContainer.innerHTML = '';
    
    if (AppState.cart.length === 0) {
        El.cartItemsContainer.innerHTML = `<div class="glass" style="padding: 40px; text-align: center; border-radius: 12px; color: var(--text-muted);">Your cart is empty.</div>`;
        El.cartSubtotal.textContent = formatPrice(0);
        El.cartTotal.textContent = formatPrice(0);
        El.checkoutBtn.disabled = true;
        return;
    }

    let subtotal = 0;
    
    AppState.cart.forEach(item => {
        subtotal += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="updateCartItemQty('${item.id}', -${item.qty})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        El.cartItemsContainer.appendChild(div);
    });

    El.cartSubtotal.textContent = formatPrice(subtotal);
    El.cartTotal.textContent = formatPrice(subtotal + 5); // $5 Delivery
    El.checkoutBtn.disabled = false;
};

const handleCheckout = () => {
    if (AppState.cart.length === 0) return;
    
    const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const order = {
        id: 'ORD-' + generateId().toUpperCase(),
        userId: AppState.currentUser.id,
        userName: AppState.currentUser.name,
        date: new Date().toISOString(),
        items: [...AppState.cart],
        total: subtotal + 5
    };

    const orders = Storage.get('orders');
    Storage.set('orders', [order, ...orders]);
    
    AppState.cart = [];
    updateCartBadge();
    showToast('Order placed successfully! Thank you.', 'success');
    switchView('shop');
};

// ==== Admin Dashboard ====
const renderAdminDashboard = () => {
    // Render Products
    const products = Storage.get('products');
    El.adminProductsTable.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image}" alt="img"></td>
            <td><strong>${p.name}</strong></td>
            <td>${formatPrice(p.price)}</td>
            <td>
                <button class="action-btn btn-edit" title="Edit" onclick="openProductModal('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn btn-delete" title="Delete" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        El.adminProductsTable.appendChild(tr);
    });

    // Render Orders
    const orders = Storage.get('orders');
    El.adminOrdersTable.innerHTML = '';
    if (orders.length === 0) {
        El.adminOrdersTable.innerHTML = `<tr><td colspan="5" style="text-align: center;">No orders yet.</td></tr>`;
    } else {
        orders.forEach(o => {
            const tr = document.createElement('tr');
            const itemsList = o.items.map(i => `${i.qty}x ${i.name}`).join(', ');
            tr.innerHTML = `
                <td><strong>${o.id}</strong></td>
                <td>${o.userName}</td>
                <td><small>${itemsList}</small></td>
                <td>${formatPrice(o.total)}</td>
                <td>${new Date(o.date).toLocaleDateString()}</td>
            `;
            El.adminOrdersTable.appendChild(tr);
        });
    }

    // Render Customers
    const users = Storage.get('users').filter(u => u.role === 'customer');
    El.adminCustomersTable.innerHTML = '';
    if (users.length === 0) {
        El.adminCustomersTable.innerHTML = `<tr><td colspan="4" style="text-align: center;">No customers registered.</td></tr>`;
    } else {
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge" style="position:static; padding:4px 8px; border-radius:12px;">Customer</span></td>
            `;
            El.adminCustomersTable.appendChild(tr);
        });
    }

    // Render Admins
    const admins = Storage.get('users').filter(u => u.role === 'admin');
    if (El.adminAdminsTable) {
        El.adminAdminsTable.innerHTML = '';
        if (admins.length === 0) {
            El.adminAdminsTable.innerHTML = `<tr><td colspan="4" style="text-align: center;">No admins registered.</td></tr>`;
        } else {
            admins.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="badge" style="position:static; padding:4px 8px; border-radius:12px; background:var(--primary);">Admin</span></td>
                `;
                El.adminAdminsTable.appendChild(tr);
            });
        }
    }
};

// Admin Modals & Actions
const openProductModal = (id = null) => {
    if (id) {
        const p = Storage.get('products').find(x => x.id === id);
        if (p) {
            document.getElementById('modal-title').textContent = 'Edit Product';
            document.getElementById('prod-id').value = p.id;
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-price').value = p.price;
            document.getElementById('prod-image').value = p.image;
        }
    } else {
        document.getElementById('modal-title').textContent = 'Add New Product';
        El.productForm.reset();
        document.getElementById('prod-id').value = '';
    }
    El.productModal.classList.remove('hidden');
};

const closeProductModal = () => {
    El.productModal.classList.add('hidden');
};

const handleProductSubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const image = document.getElementById('prod-image').value.trim();

    let products = Storage.get('products');

    if (id) {
        // Edit
        const index = products.findIndex(p => p.id === id);
        if (index > -1) {
            products[index] = { ...products[index], name, price, image };
            showToast('Product updated successfully!');
        }
    } else {
        // Add
        const newProduct = { id: 'p' + generateId(), name, price, image };
        products.push(newProduct);
        showToast('Product added successfully!');
    }

    Storage.set('products', products);
    closeProductModal();
    renderAdminDashboard();
};

const deleteProduct = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
        let products = Storage.get('products');
        products = products.filter(p => p.id !== id);
        Storage.set('products', products);
        showToast('Product deleted');
        renderAdminDashboard();
    }
};

const openAdminModal = () => {
    El.adminForm.reset();
    El.adminModal.classList.remove('hidden');
};

const closeAdminModal = () => {
    El.adminModal.classList.add('hidden');
};

const handleAdminSubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('admin-name').value.trim();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    
    const users = Storage.get('users');
    if (users.find(u => u.email === email)) {
        showToast('Email already in use', 'error');
        return;
    }

    const newAdmin = { id: 'u' + generateId(), name, email, password, role: 'admin' };
    Storage.set('users', [...users, newAdmin]);
    
    showToast('New Admin account created!', 'success');
    closeAdminModal();
    renderAdminDashboard();
};

window.openProductModal = openProductModal;
window.deleteProduct = deleteProduct;
window.updateCartItemQty = updateCartItemQty;

// ==== Event Listeners Setup ====

// Auth Forms
El.loginForm.addEventListener('submit', handleLogin);
El.registerForm.addEventListener('submit', handleRegister);

// View Toggles
El.goRegister.addEventListener('click', () => switchView('register'));
El.goLogin.addEventListener('click', () => switchView('login'));

// Navigation Buttons
El.navLogoutBtn.addEventListener('click', handleLogout);
El.navCartBtn.addEventListener('click', () => {
    switchView('cart');
    renderCart();
});
El.navAdminBtn.addEventListener('click', () => {
    switchView('admin');
    renderAdminDashboard();
});
El.backToShop.addEventListener('click', () => switchView('shop'));

// Search
El.searchInput.addEventListener('input', handleSearch);

// Cart Checkout
El.checkoutBtn.addEventListener('click', handleCheckout);

// Admin Tabs
El.adminTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        // Remove active class
        El.adminTabs.forEach(t => t.classList.remove('active'));
        El.adminTabContents.forEach(c => c.classList.add('hidden'));
        
        // Add active class
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.remove('hidden');
    });
});

// Admin Products
El.btnAddProduct.addEventListener('click', () => openProductModal());
El.closeModal.addEventListener('click', closeProductModal);
El.productForm.addEventListener('submit', handleProductSubmit);

// Admin Users
if (El.btnAddAdmin) El.btnAddAdmin.addEventListener('click', openAdminModal);
if (El.closeAdminModal) El.closeAdminModal.addEventListener('click', closeAdminModal);
if (El.adminForm) El.adminForm.addEventListener('submit', handleAdminSubmit);

// Init
switchView('login');

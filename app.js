
// Configuration
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbx5SjFBFV7PUQJ8iPJb4pAn6ZDo3owOMHEkQdO6acI3g9KyU6RuqvoRXmmrdR1J4DVGMw/exec",
    products: [],
    cart: JSON.parse(localStorage.getItem('shopping_cart')) || [],
    currentView: 'grid',
    currentPage: 1,
    itemsPerPage: 12,
    sortBy: 'default',
    currentCategory: 'all'
};

// DOM Elements
const elements = {
    // Navigation
    mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
    mobileMenu: document.getElementById('mobileMenu'),
    cartSidebar: document.getElementById('cartSidebar'),
    
    // Search
    searchInput: document.getElementById('searchInput'),
    heroSearch: document.getElementById('heroSearch'),
    
    // Stats
    totalProducts: document.getElementById('totalProducts'),
    cartCount: document.getElementById('cartCount'),
    
    // Product containers
    categoriesGrid: document.getElementById('categoriesGrid'),
    productsGrid: document.getElementById('productsGrid'),
    productsList: document.getElementById('productsList'),
    noProducts: document.getElementById('noProducts'),
    featuredSlider: document.getElementById('featuredSlider'),
    
    // Cart
    cartBody: document.getElementById('cartBody'),
    cartItems: document.getElementById('cartItems'),
    emptyCart: document.getElementById('emptyCart'),
    cartFooter: document.getElementById('cartFooter'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartTotal: document.getElementById('cartTotal'),
    
    // Modals
    productModal: document.getElementById('productModal'),
    checkoutModal: document.getElementById('checkoutModal'),
    
    // Toast & Loading
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Pagination
    pagination: document.getElementById('pagination')
};

// Format Rupiah
function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = elements.toast;
    const icon = toast.querySelector('i');
    
    // Set icon based on type
    switch(type) {
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            toast.className = 'toast error';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle';
            toast.className = 'toast warning';
            break;
        case 'info':
            icon.className = 'fas fa-info-circle';
            toast.className = 'toast info';
            break;
        default:
            icon.className = 'fas fa-check-circle';
            toast.className = 'toast';
    }
    
    elements.toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show loading
function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('active');
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    elements.mobileMenu.classList.toggle('active');
}

// Toggle cart sidebar
function toggleCart() {
    elements.cartSidebar.classList.toggle('active');
    updateCart();
}

// Load products from Google Sheets
async function loadProducts() {
    showLoading(true);
    
    try {
        const response = await fetch(CONFIG.API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            CONFIG.products = result.data || [];
            
            // Update stats
            elements.totalProducts.textContent = CONFIG.products.length;
            
            // Update UI
            renderCategories();
            renderProducts();
            renderFeaturedProducts();
            
            // Save to localStorage
            localStorage.setItem('products_cache', JSON.stringify({
                data: CONFIG.products,
                timestamp: new Date().toISOString()
            }));
            
            showToast('Produk berhasil dimuat', 'success');
            
        } else {
            throw new Error(result.error || 'Gagal memuat produk');
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Gagal memuat produk', 'error');
        
        // Try to load from cache
        const cache = localStorage.getItem('products_cache');
        if (cache) {
            const cachedData = JSON.parse(cache);
            CONFIG.products = cachedData.data;
            elements.totalProducts.textContent = CONFIG.products.length;
            renderCategories();
            renderProducts();
            showToast('Menggunakan data cache', 'warning');
        }
        
    } finally {
        showLoading(false);
    }
}

// Get unique categories from products
function getCategories() {
    const categories = new Set();
    CONFIG.products.forEach(product => {
        if (product.kategori) {
            categories.add(product.kategori);
        }
    });
    
    return Array.from(categories).sort();
}

// Render categories
function renderCategories() {
    const categories = getCategories();
    const container = elements.categoriesGrid;
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="no-categories">Belum ada kategori</p>';
        return;
    }
    
    // Add "All" category
    const allCategories = [
        { name: 'Semua', count: CONFIG.products.length, icon: 'fas fa-boxes' },
        ...categories.map(cat => ({
            name: cat,
            count: CONFIG.products.filter(p => p.kategori === cat).length,
            icon: getCategoryIcon(cat)
        }))
    ];
    
    let html = '';
    
    allCategories.forEach(category => {
        html += `
            <div class="category-card" onclick="filterByCategory('${category.name}')">
                <div class="category-icon">
                    <i class="${category.icon}"></i>
                </div>
                <h3 class="category-name">${category.name}</h3>
                <span class="category-count">${category.count} produk</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Get icon for category
function getCategoryIcon(category) {
    const icons = {
        'Elektronik': 'fas fa-laptop',
        'Fashion': 'fas fa-tshirt',
        'Makanan & Minuman': 'fas fa-utensils',
        'Olahraga': 'fas fa-dumbbell',
        'Rumah Tangga': 'fas fa-home',
        'Olahraga': 'fas fa-running'
    };
    
    return icons[category] || 'fas fa-box';
}

// Filter products by category
function filterByCategory(category) {
    CONFIG.currentCategory = category === 'Semua' ? 'all' : category;
    CONFIG.currentPage = 1;
    renderProducts();
    
    // Scroll to products section
    document.querySelector('#produk').scrollIntoView({ behavior: 'smooth' });
    
    showToast(`Menampilkan kategori: ${category}`, 'info');
}

// Change view (grid/list)
function changeView(viewType) {
    CONFIG.currentView = viewType;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.view-btn').classList.add('active');
    
    // Show/hide containers
    if (viewType === 'grid') {
        elements.productsGrid.style.display = 'grid';
        elements.productsList.style.display = 'none';
    } else {
        elements.productsGrid.style.display = 'none';
        elements.productsList.style.display = 'block';
        renderProductsList();
    }
}

// Sort products
function sortProducts() {
    const sortSelect = document.getElementById('sortSelect');
    CONFIG.sortBy = sortSelect.value;
    CONFIG.currentPage = 1;
    renderProducts();
}

// Get sorted and filtered products
function getFilteredProducts() {
    let filtered = CONFIG.products;
    
    // Filter by category
    if (CONFIG.currentCategory !== 'all') {
        filtered = filtered.filter(p => p.kategori === CONFIG.currentCategory);
    }
    
    // Filter by search
    const searchTerm = elements.searchInput.value.toLowerCase() || 
                      elements.heroSearch.value.toLowerCase();
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            (p.nama && p.nama.toLowerCase().includes(searchTerm)) ||
            (p.deskripsi && p.deskripsi.toLowerCase().includes(searchTerm)) ||
            (p.kategori && p.kategori.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort products
    switch(CONFIG.sortBy) {
        case 'name_asc':
            filtered.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
            break;
        case 'name_desc':
            filtered.sort((a, b) => (b.nama || '').localeCompare(a.nama || ''));
            break;
        case 'price_asc':
            filtered.sort((a, b) => (a.harga || 0) - (b.harga || 0));
            break;
        case 'price_desc':
            filtered.sort((a, b) => (b.harga || 0) - (a.harga || 0));
            break;
        case 'stock_desc':
            filtered.sort((a, b) => (b.stok || 0) - (a.stok || 0));
            break;
    }
    
    return filtered;
}

// Render products (grid view)
function renderProducts() {
    const filteredProducts = getFilteredProducts();
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / CONFIG.itemsPerPage);
    
    // Show/hide no products message
    if (totalProducts === 0) {
        elements.productsGrid.style.display = 'none';
        elements.noProducts.style.display = 'block';
        elements.pagination.innerHTML = '';
        return;
    }
    
    elements.productsGrid.style.display = 'grid';
    elements.noProducts.style.display = 'none';
    
    // Calculate pagination
    const startIndex = (CONFIG.currentPage - 1) * CONFIG.itemsPerPage;
    const endIndex = startIndex + CONFIG.itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Render products
    let html = '';
    
    paginatedProducts.forEach(product => {
        const isOutOfStock = (product.stok || 0) <= 0;
        const stockStatus = getStockStatus(product.stok || 0);
        const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=No+Image';
        
        html += `
            <div class="product-card">
                ${product.kategori === 'Elektronik' ? '<span class="product-badge">Trending</span>' : ''}
                
                <img src="${imageUrl}" 
                     alt="${product.nama}" 
                     class="product-image"
                     onclick="showProductModal('${product.nama}')">
                
                <div class="product-content">
                    <h3 class="product-title" onclick="showProductModal('${product.nama}')">
                        ${product.nama}
                    </h3>
                    
                    <div class="product-price">${formatRupiah(product.harga || 0)}</div>
                    
                    <span class="product-category">${product.kategori || 'Lainnya'}</span>
                    
                    <div class="product-stock">
                        <span class="${stockStatus.class}">
                            <i class="fas fa-box"></i> ${stockStatus.text}
                        </span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-add-cart" 
                                onclick="addToCart('${product.nama}')"
                                ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> 
                            ${isOutOfStock ? 'Stok Habis' : 'Tambah'}
                        </button>
                        
                        <button class="btn-view-details" onclick="showProductModal('${product.nama}')">
                            <i class="fas fa-eye"></i> Detail
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    elements.productsGrid.innerHTML = html;
    
    // Render pagination
    renderPagination(totalPages);
    
    // Update list view if active
    if (CONFIG.currentView === 'list') {
        renderProductsList();
    }
}

// Render products (list view)
function renderProductsList() {
    const filteredProducts = getFilteredProducts();
    const startIndex = (CONFIG.currentPage - 1) * CONFIG.itemsPerPage;
    const endIndex = startIndex + CONFIG.itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    let html = '';
    
    paginatedProducts.forEach(product => {
        const isOutOfStock = (product.stok || 0) <= 0;
        const stockStatus = getStockStatus(product.stok || 0);
        const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=No+Image';
        
        html += `
            <div class="product-list-item">
                <img src="${imageUrl}" 
                     alt="${product.nama}" 
                     class="product-list-image"
                     onclick="showProductModal('${product.nama}')">
                
                <div class="product-list-content">
                    <h3 onclick="showProductModal('${product.nama}')">${product.nama}</h3>
                    <div class="product-price">${formatRupiah(product.harga || 0)}</div>
                    <span class="product-category">${product.kategori || 'Lainnya'}</span>
                    <p>${(product.deskripsi || '').substring(0, 150)}...</p>
                    <div class="product-stock ${stockStatus.class}">
                        <i class="fas fa-box"></i> ${stockStatus.text}
                    </div>
                </div>
                
                <div class="product-list-actions">
                    <button class="btn-add-cart" 
                            onclick="addToCart('${product.nama}')"
                            ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> 
                        ${isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}
                    </button>
                    
                    <button class="btn-view-details" onclick="showProductModal('${product.nama}')">
                        <i class="fas fa-eye"></i> Lihat Detail
                    </button>
                </div>
            </div>
        `;
    });
    
    elements.productsList.innerHTML = html;
}

// Get stock status
function getStockStatus(stok) {
    if (stok > 20) return { 
        class: 'stock-available', 
        text: 'Tersedia', 
        color: '#27ae60' 
    };
    if (stok > 10) return { 
        class: 'stock-available', 
        text: 'Tersedia', 
        color: '#27ae60' 
    };
    if (stok > 0) return { 
        class: 'stock-low', 
        text: 'Stok Menipis', 
        color: '#f39c12' 
    };
    return { 
        class: 'stock-out', 
        text: 'Stok Habis', 
        color: '#e74c3c' 
    };
}

// Render pagination
function renderPagination(totalPages) {
    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <button class="pagination-btn" 
                onclick="changePage(${CONFIG.currentPage - 1})"
                ${CONFIG.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, CONFIG.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === CONFIG.currentPage ? 'active' : ''}"
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    html += `
        <button class="pagination-btn" 
                onclick="changePage(${CONFIG.currentPage + 1})"
                ${CONFIG.currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    elements.pagination.innerHTML = html;
}

// Change page
function changePage(page) {
    CONFIG.currentPage = page;
    renderProducts();
    
    // Scroll to top of products
    document.querySelector('#produk').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Render featured products
function renderFeaturedProducts() {
    const featured = CONFIG.products
        .filter(p => (p.stok || 0) > 0)
        .sort((a, b) => (b.harga || 0) - (a.harga || 0))
        .slice(0, 3);
    
    if (featured.length === 0) {
        elements.featuredSlider.innerHTML = '<p>Tidak ada produk unggulan</p>';
        return;
    }
    
    let html = '';
    
    featured.forEach(product => {
        const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=No+Image';
        
        html += `
            <div class="product-card featured-product">
                <span class="featured-badge">Unggulan</span>
                
                <img src="${imageUrl}" 
                     alt="${product.nama}" 
                     class="product-image"
                     onclick="showProductModal('${product.nama}')">
                
                <div class="product-content">
                    <h3 class="product-title" onclick="showProductModal('${product.nama}')">
                        ${product.nama}
                    </h3>
                    
                    <div class="product-price">${formatRupiah(product.harga || 0)}</div>
                    
                    <button class="btn-add-cart" onclick="addToCart('${product.nama}')">
                        <i class="fas fa-cart-plus"></i> Beli Sekarang
                    </button>
                </div>
            </div>
        `;
    });
    
    elements.featuredSlider.innerHTML = html;
}

// Show product modal
function showProductModal(productName) {
    const product = CONFIG.products.find(p => p.nama === productName);
    
    if (!product) {
        showToast('Produk tidak ditemukan', 'error');
        return;
    }
    
    const stockStatus = getStockStatus(product.stok || 0);
    const imageUrl = product.image || 'https://via.placeholder.com/400x300?text=No+Image';
    const isOutOfStock = (product.stok || 0) <= 0;
    
    // Update modal content
    document.getElementById('modalProductName').textContent = product.nama;
    
    document.getElementById('modalProductContent').innerHTML = `
        <div class="product-modal-content">
            <div>
                <img src="${imageUrl}" 
                     alt="${product.nama}" 
                     class="product-modal-image">
            </div>
            
            <div class="product-modal-info">
                <h2>${product.nama}</h2>
                
                <div class="product-modal-price">${formatRupiah(product.harga || 0)}</div>
                
                <div class="product-modal-stock ${stockStatus.class}">
                    <i class="fas fa-box"></i> 
                    ${stockStatus.text} (${product.stok || 0} unit)
                </div>
                
                <div class="product-modal-category">
                    <strong>Kategori:</strong> ${product.kategori || 'Lainnya'}
                </div>
                
                <div class="product-modal-desc">
                    <strong>Deskripsi:</strong><br>
                    ${product.deskripsi || 'Tidak ada deskripsi'}
                </div>
                
                <div class="product-modal-actions">
                    <button class="btn-add-cart" 
                            onclick="addToCart('${product.nama}')"
                            ${isOutOfStock ? 'disabled' : ''}
                            style="width: 100%; padding: 15px; font-size: 16px;">
                        <i class="fas fa-cart-plus"></i> 
                        ${isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    elements.productModal.classList.add('active');
}

// Close modal
function closeModal() {
    elements.productModal.classList.remove('active');
}

// Add to cart
function addToCart(productName) {
    const product = CONFIG.products.find(p => p.nama === productName);
    
    if (!product) {
        showToast('Produk tidak ditemukan', 'error');
        return;
    }
    
    if ((product.stok || 0) <= 0) {
        showToast('Stok produk habis', 'error');
        return;
    }
    
    // Check if product already in cart
    const existingItem = CONFIG.cart.find(item => item.nama === productName);
    
    if (existingItem) {
        // Check stock availability
        if (existingItem.quantity >= (product.stok || 0)) {
            showToast('Stok tidak mencukupi', 'error');
            return;
        }
        
        existingItem.quantity += 1;
    } else {
        CONFIG.cart.push({
            ...product,
            quantity: 1
        });
    }
    
    // Save cart to localStorage
    localStorage.setItem('shopping_cart', JSON.stringify(CONFIG.cart));
    
    // Update UI
    updateCartCount();
    updateCart();
    
    showToast(`${product.nama} ditambahkan ke keranjang`, 'success');
    
    // Open cart on mobile
    if (window.innerWidth <= 768) {
        toggleCart();
    }
}

// Update cart count
function updateCartCount() {
    const totalItems = CONFIG.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
}

// Update cart
function updateCart() {
    updateCartCount();
    
    if (CONFIG.cart.length === 0) {
        elements.emptyCart.style.display = 'block';
        elements.cartItems.style.display = 'none';
        elements.cartFooter.style.display = 'none';
        return;
    }
    
    elements.emptyCart.style.display = 'none';
    elements.cartItems.style.display = 'block';
    elements.cartFooter.style.display = 'block';
    
    // Render cart items
    let itemsHtml = '';
    let subtotal = 0;
    
    CONFIG.cart.forEach((item, index) => {
        const itemTotal = (item.harga || 0) * item.quantity;
        subtotal += itemTotal;
        const imageUrl = item.image || 'https://via.placeholder.com/80x80?text=No+Image';
        
        itemsHtml += `
            <div class="cart-item">
                <img src="${imageUrl}" 
                     alt="${item.nama}" 
                     class="cart-item-image">
                
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nama}</div>
                    <div class="cart-item-price">${formatRupiah(item.harga || 0)}</div>
                    
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn" 
                                    onclick="updateCartQuantity(${index}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" 
                                    onclick="updateCartQuantity(${index}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <button class="remove-item" onclick="removeFromCart(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    elements.cartItems.innerHTML = itemsHtml;
    
    // Update totals
    elements.cartSubtotal.textContent = formatRupiah(subtotal);
    elements.cartTotal.textContent = formatRupiah(subtotal);
}

// Update cart quantity
function updateCartQuantity(index, change) {
    const item = CONFIG.cart[index];
    
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    // Check stock availability
    const product = CONFIG.products.find(p => p.nama === item.nama);
    const maxQuantity = product ? (product.stok || 0) : 0;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > maxQuantity) {
        showToast('Stok tidak mencukupi', 'error');
        return;
    }
    
    item.quantity = newQuantity;
    localStorage.setItem('shopping_cart', JSON.stringify(CONFIG.cart));
    updateCart();
}

// Remove from cart
function removeFromCart(index) {
    CONFIG.cart.splice(index, 1);
    localStorage.setItem('shopping_cart', JSON.stringify(CONFIG.cart));
    updateCart();
    showToast('Produk dihapus dari keranjang', 'info');
}

// Clear cart
function clearCart() {
    if (CONFIG.cart.length === 0) return;
    
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
        CONFIG.cart = [];
        localStorage.setItem('shopping_cart', JSON.stringify(CONFIG.cart));
        updateCart();
        showToast('Keranjang dikosongkan', 'info');
    }
}

// Checkout
function checkout() {
    if (CONFIG.cart.length === 0) {
        showToast('Keranjang belanja kosong', 'error');
        return;
    }
    
    // Generate order summary
    let summaryHtml = '';
    let subtotal = 0;
    
    CONFIG.cart.forEach(item => {
        const itemTotal = (item.harga || 0) * item.quantity;
        subtotal += itemTotal;
        
        summaryHtml += `
            <div class="order-item">
                <span>${item.nama} x${item.quantity}</span>
                <span>${formatRupiah(itemTotal)}</span>
            </div>
        `;
    });
    
    summaryHtml += `
        <div class="order-total">
            <span>Total</span>
            <span>${formatRupiah(subtotal)}</span>
        </div>
    `;
    
    document.getElementById('orderSummary').innerHTML = summaryHtml;
    
    // Show checkout modal
    elements.checkoutModal.classList.add('active');
}

// Close checkout modal
function closeCheckoutModal() {
    elements.checkoutModal.classList.remove('active');
    document.getElementById('checkoutForm').reset();
}

// Submit order
function submitOrder(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('customerPhone').value.trim(),
        email: document.getElementById('customerEmail').value.trim(),
        address: document.getElementById('customerAddress').value.trim(),
        payment: document.getElementById('paymentMethod').value,
        items: CONFIG.cart,
        total: CONFIG.cart.reduce((sum, item) => sum + ((item.harga || 0) * item.quantity), 0),
        timestamp: new Date().toISOString()
    };
    
    // Validation
    if (!formData.name || !formData.phone || !formData.address || !formData.payment) {
        showToast('Harap isi semua field yang wajib diisi', 'error');
        return;
    }
    
    showLoading(true);
    
    // In a real app, you would send this to your backend
    // For now, we'll simulate sending to Google Sheets
    
    setTimeout(() => {
        // Create WhatsApp message
        let message = `*PESANAN BARU*%0A%0A`;
        message += `Nama: ${formData.name}%0A`;
        message += `Telepon: ${formData.phone}%0A`;
        message += `Email: ${formData.email}%0A`;
        message += `Alamat: ${formData.address}%0A`;
        message += `Metode Bayar: ${formData.payment}%0A%0A`;
        message += `*DETAIL PESANAN:*%0A`;
        
        CONFIG.cart.forEach(item => {
            message += `- ${item.nama} x${item.quantity}: ${formatRupiah((item.harga || 0) * item.quantity)}%0A`;
        });
        
        message += `%0A*TOTAL: ${formatRupiah(formData.total)}*`;
        
        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(formData);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Clear cart
        CONFIG.cart = [];
        localStorage.setItem('shopping_cart', JSON.stringify(CONFIG.cart));
        updateCart();
        
        // Close modal
        closeCheckoutModal();
        
        // Redirect to WhatsApp
        window.open(`https://wa.me/855965202138?text=${message}`, '_blank');
        
        showLoading(false);
        showToast('Pesanan berhasil! Mengarahkan ke WhatsApp...', 'success');
        
    }, 1500);
}

// Initialize app
function initApp() {
    // Load products
    loadProducts();
    
    // Setup event listeners
    elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    // Search functionality
    elements.searchInput.addEventListener('input', () => {
        CONFIG.currentPage = 1;
        renderProducts();
    });
    
    elements.heroSearch.addEventListener('input', () => {
        CONFIG.currentPage = 1;
        renderProducts();
    });
    
    // Cart functionality
    updateCart();
    
    // Checkout form
    document.getElementById('checkoutForm').addEventListener('submit', submitOrder);
    
    // Close modals on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeCheckoutModal();
        }
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.productModal) closeModal();
        if (e.target === elements.checkoutModal) closeCheckoutModal();
    });
    
    // Auto-refresh products every 5 minutes
    setInterval(loadProducts, 300000);
    
    // Initialize cart count
    updateCartCount();
}

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
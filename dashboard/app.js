// Configuration
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbx5SjFBFV7PUQJ8iPJb4pAn6ZDo3owOMHEkQdO6acI3g9KyU6RuqvoRXmmrdR1J4DVGMw/exec",
    items: [],
    currentView: 'table',
    currentPage: 1,
    itemsPerPage: 10
};

// DOM Elements
const elements = {
    status: document.getElementById('status'),
    totalBarang: document.getElementById('totalBarang'),
    totalStok: document.getElementById('totalStok'),
    totalNilai: document.getElementById('totalNilai'),
    totalKategori: document.getElementById('totalKategori'),
    mobileTotal: document.getElementById('mobileTotal'),
    recentItems: document.getElementById('recentItems'),
    dataContent: document.getElementById('dataContent'),
    dataLoading: document.getElementById('dataLoading'),
    dataCount: document.getElementById('dataCount'),
    searchInput: document.getElementById('searchInput'),
    formTambah: document.getElementById('formTambah'),
    formEdit: document.getElementById('formEdit'),
    inventoryValue: document.getElementById('inventoryValue'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Format Rupiah
function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Get category class
function getCategoryClass(kategori) {
    if (!kategori) return 'category-lainnya';
    
    const kat = kategori.toLowerCase();
    if (kat.includes('olahraga')) return 'category-olahrga';
    if (kat.includes('fashion')) return 'category-fashion';
    if (kat.includes('makanan') || kat.includes('minuman')) return 'category-makanan-minuman';
    if (kat.includes('elektronik')) return 'category-elektronik';
    if (kat.includes('rumah') && kat.includes('tangga')) return 'category-rumah-tangga';
    return 'category-lainnya';
}

// Get stock status
function getStockStatus(stok) {
    if (stok > 20) return { class: 'stock-high', text: 'Stok Tinggi', icon: '✓' };
    if (stok > 10) return { class: 'stock-medium', text: 'Stok Cukup', icon: '⚠' };
    if (stok > 0) return { class: 'stock-low', text: 'Stok Menipis', icon: '⚠' };
    return { class: 'stock-out', text: 'Stok Habis', icon: '✗' };
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = elements.toast;
    const icon = toast.querySelector('i');
    
    // Set icon based on type
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        toast.style.background = '#e74c3c';
    } else if (type === 'warning') {
        icon.className = 'fas fa-exclamation-triangle';
        toast.style.background = '#f39c12';
    } else {
        icon.className = 'fas fa-check-circle';
        toast.style.background = '#27ae60';
    }
    
    elements.toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show loading overlay
function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('active');
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

// Update status
function updateStatus(message, type = 'info') {
    const status = elements.status;
    const icon = status.querySelector('i');
    
    status.querySelector('span').textContent = message;
    
    switch(type) {
        case 'success':
            icon.style.color = '#27ae60';
            status.style.background = '#d4edda';
            status.style.color = '#155724';
            break;
        case 'error':
            icon.style.color = '#e74c3c';
            status.style.background = '#f8d7da';
            status.style.color = '#721c24';
            break;
        case 'warning':
            icon.style.color = '#f39c12';
            status.style.background = '#fff3cd';
            status.style.color = '#856404';
            break;
        default:
            icon.style.color = '#3498db';
            status.style.background = '#d1ecf1';
            status.style.color = '#0c5460';
    }
}

// Toggle sidebar (mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Show section
function showSection(sectionId) {
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
    
    // Update menu buttons
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the correct menu button
    const menuButtons = document.querySelectorAll('.menu-btn');
    menuButtons.forEach(btn => {
        if (btn.textContent.includes(getSectionName(sectionId))) {
            btn.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'data': 'Data Barang',
        'tambah': 'Tambah Barang',
        'laporan': 'Laporan'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Load data if needed
    if (sectionId === 'data') {
        updateDataTable();
    } else if (sectionId === 'laporan') {
        updateReports();
    }
}

function getSectionName(sectionId) {
    const names = {
        'dashboard': 'Dashboard',
        'data': 'Data Barang',
        'tambah': 'Tambah Barang',
        'laporan': 'Laporan'
    };
    return names[sectionId] || '';
}

// Load data from Google Sheets
async function loadData() {
    updateStatus('Memuat data dari Google Sheets...', 'info');
    showLoading(true);
    
    try {
        const response = await fetch(CONFIG.API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            CONFIG.items = result.data || [];
            updateDashboard();
            updateRecentItems();
            updateDataTable();
            updateReports();
            
            updateStatus(`${CONFIG.items.length} data berhasil dimuat`, 'success');
            showToast('Data berhasil diperbarui', 'success');
            
            // Save to localStorage
            localStorage.setItem('inventory_cache', JSON.stringify({
                data: CONFIG.items,
                timestamp: new Date().toISOString()
            }));
            
        } else {
            throw new Error(result.error || 'Gagal memuat data');
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        updateStatus(`Gagal memuat data: ${error.message}`, 'error');
        showToast('Gagal memuat data', 'error');
        
        // Try to load from cache
        const cache = localStorage.getItem('inventory_cache');
        if (cache) {
            const cachedData = JSON.parse(cache);
            CONFIG.items = cachedData.data;
            updateStatus('Menggunakan data cache', 'warning');
            updateDashboard();
            updateDataTable();
        }
        
    } finally {
        showLoading(false);
    }
}

// Update dashboard statistics
function updateDashboard() {
    const totalBarang = CONFIG.items.length;
    const totalStok = CONFIG.items.reduce((sum, item) => sum + (Number(item.stok) || 0), 0);
    const totalNilai = CONFIG.items.reduce((sum, item) => sum + ((Number(item.harga) || 0) * (Number(item.stok) || 0)), 0);
    const categories = [...new Set(CONFIG.items.map(item => item.kategori))].filter(Boolean);
    
    elements.totalBarang.textContent = totalBarang;
    elements.totalStok.textContent = totalStok;
    elements.totalNilai.textContent = formatRupiah(totalNilai);
    elements.totalKategori.textContent = categories.length;
    elements.mobileTotal.textContent = totalBarang;
}

// Update recent items
function updateRecentItems() {
    const container = elements.recentItems;
    const recentItems = CONFIG.items.slice(-5).reverse();
    
    if (recentItems.length === 0) {
        container.innerHTML = '<div class="no-data">Belum ada data barang</div>';
        return;
    }
    
    let html = '<div class="recent-grid">';
    
    recentItems.forEach(item => {
        const stockStatus = getStockStatus(Number(item.stok) || 0);
        const imageUrl = item.image || 'https://via.placeholder.com/150?text=No+Image';
        
        html += `
            <div class="recent-item">
                <img src="${imageUrl}" alt="${item.nama}" class="recent-image">
                <div class="recent-info">
                    <div class="recent-name">${item.nama}</div>
                    <div class="recent-details">
                        <span class="recent-price">${formatRupiah(item.harga || 0)}</span>
                        <span class="recent-stock ${stockStatus.class}">${item.stok || 0} stok</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add CSS for recent items
    if (!document.getElementById('recent-styles')) {
        const style = document.createElement('style');
        style.id = 'recent-styles';
        style.textContent = `
            .recent-grid {
                display: grid;
                gap: 15px;
            }
            .recent-item {
                display: flex;
                gap: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            .recent-image {
                width: 60px;
                height: 60px;
                border-radius: 8px;
                object-fit: cover;
            }
            .recent-info {
                flex: 1;
            }
            .recent-name {
                font-weight: 600;
                margin-bottom: 5px;
                color: #2c3e50;
            }
            .recent-details {
                display: flex;
                gap: 15px;
                font-size: 14px;
            }
            .recent-price {
                color: #28a745;
                font-weight: bold;
            }
            .recent-stock {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            .no-data {
                text-align: center;
                padding: 30px;
                color: #6c757d;
            }
        `;
        document.head.appendChild(style);
    }
}

// Toggle view between table and grid
function toggleView(viewType) {
    CONFIG.currentView = viewType;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.view-btn').classList.add('active');
    
    updateDataTable();
}

// Update data table/grid
function updateDataTable() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    
    // Filter items
    const filteredItems = CONFIG.items.filter(item => {
        return !searchTerm || 
               (item.nama && item.nama.toLowerCase().includes(searchTerm)) ||
               (item.kategori && item.kategori.toLowerCase().includes(searchTerm)) ||
               (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm));
    });
    
    // Update count
    elements.dataCount.textContent = `${filteredItems.length} barang ditemukan`;
    
    // Hide loading
    elements.dataLoading.style.display = 'none';
    
    // Render based on view type
    if (CONFIG.currentView === 'table') {
        renderTableView(filteredItems);
    } else {
        renderGridView(filteredItems);
    }
}

// Render table view
function renderTableView(items) {
    if (items.length === 0) {
        elements.dataContent.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-box-open fa-3x"></i>
                <h3>Tidak ada data barang</h3>
                <p>${elements.searchInput.value ? 'Tidak ditemukan barang dengan kata kunci tersebut' : 'Klik "Tambah Barang" untuk menambah data'}</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Gambar</th>
                        <th>Nama Barang</th>
                        <th>Harga</th>
                        <th>Stok</th>
                        <th>Kategori</th>
                        <th>Deskripsi</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    items.forEach((item, index) => {
        const stockStatus = getStockStatus(Number(item.stok) || 0);
        const imageUrl = item.image || 'https://via.placeholder.com/50?text=No+Img';
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <img src="${imageUrl}" 
                         alt="${item.nama}" 
                         class="item-image"
                         onclick="showImagePreview('${imageUrl}', '${item.nama}')">
                </td>
                <td><strong>${item.nama || '-'}</strong></td>
                <td class="price-cell">${formatRupiah(item.harga || 0)}</td>
                <td>
                    <span class="stock-badge ${stockStatus.class}">
                        ${stockStatus.icon} ${item.stok || 0}
                    </span>
                </td>
                <td>
                    <span class="category-badge ${getCategoryClass(item.kategori)}">
                        ${item.kategori || '-'}
                    </span>
                </td>
                <td class="desc-cell">${item.deskripsi || '-'}</td>
                <td>
                    <div class="action-buttons-small">
                        <button class="btn-action btn-edit-small" onclick="editItem(${index})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete-small" onclick="confirmDelete(${index})" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    elements.dataContent.innerHTML = html;
}

// Render grid view
function renderGridView(items) {
    if (items.length === 0) {
        elements.dataContent.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-box-open fa-3x"></i>
                <h3>Tidak ada data barang</h3>
                <p>${elements.searchInput.value ? 'Tidak ditemukan barang dengan kata kunci tersebut' : 'Klik "Tambah Barang" untuk menambah data'}</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid-view">';
    
    items.forEach((item, index) => {
        const stockStatus = getStockStatus(Number(item.stok) || 0);
        const imageUrl = item.image || 'https://via.placeholder.com/300x200?text=No+Image';
        
        html += `
            <div class="grid-item">
                <img src="${imageUrl}" 
                     alt="${item.nama}" 
                     class="grid-image"
                     onclick="showImagePreview('${imageUrl}', '${item.nama}')">
                <div class="grid-content">
                    <h4 class="grid-title">${item.nama}</h4>
                    <div class="grid-price">${formatRupiah(item.harga || 0)}</div>
                    <div class="grid-stock ${stockStatus.class}">
                        ${stockStatus.icon} Stok: ${item.stok || 0}
                    </div>
                    <div class="grid-category ${getCategoryClass(item.kategori)}">
                        ${item.kategori || 'Lainnya'}
                    </div>
                    <p class="grid-desc">${(item.deskripsi || '').substring(0, 80)}${(item.deskripsi || '').length > 80 ? '...' : ''}</p>
                    <div class="grid-actions">
                        <button class="grid-btn grid-btn-edit" onclick="editItem(${index})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="grid-btn grid-btn-delete" onclick="confirmDelete(${index})">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    elements.dataContent.innerHTML = html;
}

// Show image preview
function showImagePreview(imageUrl, title) {
    // Create modal if not exists
    if (!document.getElementById('imagePreviewModal')) {
        const modal = document.createElement('div');
        modal.id = 'imagePreviewModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90%; max-height: 90%; background: transparent;">
                <span class="close" onclick="this.parentElement.parentElement.remove()" style="color: white; font-size: 40px; position: absolute; top: -50px; right: -10px;">&times;</span>
                <img src="${imageUrl}" alt="${title}" style="width: 100%; height: auto; border-radius: 10px;">
                <div style="color: white; text-align: center; margin-top: 10px;">${title}</div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        const modal = document.getElementById('imagePreviewModal');
        modal.querySelector('img').src = imageUrl;
        modal.querySelector('img').alt = title;
        modal.querySelector('div').textContent = title;
    }
    
    document.getElementById('imagePreviewModal').classList.add('active');
}

// Edit item
function editItem(index) {
    const item = CONFIG.items[index];
    
    if (!item) {
        showToast('Item tidak ditemukan', 'error');
        return;
    }
    
    // Fill edit form
    document.getElementById('editId').value = index;
    document.getElementById('editNama').value = item.nama || '';
    document.getElementById('editHarga').value = item.harga || 0;
    document.getElementById('editStok').value = item.stok || 0;
    document.getElementById('editKategori').value = item.kategori || 'Lainnya';
    document.getElementById('editDeskripsi').value = item.deskripsi || '';
    
    // Show modal
    document.getElementById('editModal').classList.add('active');
}

// Confirm delete
function confirmDelete(index) {
    const item = CONFIG.items[index];
    
    if (!item) {
        showToast('Item tidak ditemukan', 'error');
        return;
    }
    
    if (confirm(`Apakah Anda yakin ingin menghapus "${item.nama}"?`)) {
        deleteItem(index);
    }
}

// Delete item
async function deleteItem(index) {
    const item = CONFIG.items[index];
    
    if (!item) {
        showToast('Item tidak ditemukan', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                index: index
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove from local array
            CONFIG.items.splice(index, 1);
            
            // Update UI
            updateDashboard();
            updateRecentItems();
            updateDataTable();
            
            showToast('Barang berhasil dihapus', 'success');
            updateStatus('Barang berhasil dihapus', 'success');
            
        } else {
            throw new Error(result.error || 'Gagal menghapus data');
        }
        
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Gagal menghapus barang', 'error');
        updateStatus(`Gagal menghapus: ${error.message}`, 'error');
        
    } finally {
        showLoading(false);
    }
}

// Close modal
function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Preview image in form
function previewImage() {
    const url = document.getElementById('image').value;
    const preview = document.getElementById('imagePreview');
    
    if (url && url.startsWith('http')) {
        preview.src = url;
    } else {
        preview.src = 'https://via.placeholder.com/150?text=Pilih+Gambar';
    }
}

// Use sample image
function useSampleImage() {
    const sampleImages = [
        'https://upload.wikimedia.org/wikipedia/commons/2/28/Bakso_mi_bihun.jpg',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12'
    ];
    
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    document.getElementById('image').value = randomImage;
    previewImage();
}

// Clear image
function clearImage() {
    document.getElementById('image').value = '';
    previewImage();
}

// Reset form
function resetForm() {
    document.getElementById('formTambah').reset();
    document.getElementById('kategori').value = 'Elektronik';
    previewImage();
    showToast('Form telah direset', 'info');
}

// Update reports
function updateReports() {
    if (CONFIG.items.length === 0) {
        elements.inventoryValue.innerHTML = '<div class="no-data">Tidak ada data</div>';
        return;
    }
    
    // Calculate inventory value
    const totalValue = CONFIG.items.reduce((sum, item) => sum + ((Number(item.harga) || 0) * (Number(item.stok) || 0)), 0);
    const avgPrice = CONFIG.items.reduce((sum, item) => sum + (Number(item.harga) || 0), 0) / CONFIG.items.length;
    const totalStock = CONFIG.items.reduce((sum, item) => sum + (Number(item.stok) || 0), 0);
    
    elements.inventoryValue.innerHTML = `
        <div class="inventory-stats">
            <div class="inventory-stat">
                <div class="stat-label">Total Nilai</div>
                <div class="stat-value">${formatRupiah(totalValue)}</div>
            </div>
            <div class="inventory-stat">
                <div class="stat-label">Rata-rata Harga</div>
                <div class="stat-value">${formatRupiah(Math.round(avgPrice))}</div>
            </div>
            <div class="inventory-stat">
                <div class="stat-label">Total Stok</div>
                <div class="stat-value">${totalStock} unit</div>
            </div>
        </div>
    `;
}

// Export data
function exportData() {
    if (CONFIG.items.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    const headers = ['Nama', 'Harga', 'Stok', 'Kategori', 'Deskripsi', 'Gambar'];
    const csvContent = [
        headers.join(','),
        ...CONFIG.items.map(item => [
            `"${item.nama || ''}"`,
            item.harga || 0,
            item.stok || 0,
            `"${item.kategori || ''}"`,
            `"${(item.deskripsi || '').replace(/"/g, '""')}"`,
            `"${item.image || ''}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `data-barang-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data berhasil diexport ke CSV', 'success');
}

// Print report
function printReport() {
    window.print();
}

// Export report
function exportReport() {
    showToast('Fitur export report sedang dikembangkan', 'info');
}

// Generate summary
function generateSummary() {
    showToast('Fitur ringkasan PDF sedang dikembangkan', 'info');
}

// Initialize app
function initApp() {
    // Load data on startup
    loadData();
    
    // Setup search
    elements.searchInput.addEventListener('input', updateDataTable);
    
    // Setup form submission
    elements.formTambah.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            nama: document.getElementById('nama').value.trim(),
            harga: Number(document.getElementById('harga').value) || 0,
            stok: Number(document.getElementById('stok').value) || 0,
            kategori: document.getElementById('kategori').value,
            deskripsi: document.getElementById('deskripsi').value.trim(),
            image: document.getElementById('image').value.trim() || 'https://via.placeholder.com/150'
        };
        
        // Validation
        if (!formData.nama) {
            showToast('Nama barang harus diisi', 'error');
            return;
        }
        
        if (formData.harga < 0) {
            showToast('Harga tidak boleh negatif', 'error');
            return;
        }
        
        if (formData.stok < 0) {
            showToast('Stok tidak boleh negatif', 'error');
            return;
        }
        
        showLoading(true);
        
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    data: formData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Add to local array
                CONFIG.items.push(formData);
                
                // Update UI
                updateDashboard();
                updateRecentItems();
                
                // Reset form
                resetForm();
                
                showToast('Barang berhasil ditambahkan', 'success');
                updateStatus('Barang berhasil ditambahkan', 'success');
                
                // Switch to data section
                showSection('data');
                
            } else {
                throw new Error(result.error || 'Gagal menyimpan data');
            }
            
        } catch (error) {
            console.error('Error saving item:', error);
            showToast('Gagal menambahkan barang', 'error');
            updateStatus(`Gagal menyimpan: ${error.message}`, 'error');
            
        } finally {
            showLoading(false);
        }
    });
    
    // Setup edit form submission
    elements.formEdit.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const index = document.getElementById('editId').value;
        const formData = {
            nama: document.getElementById('editNama').value.trim(),
            harga: Number(document.getElementById('editHarga').value) || 0,
            stok: Number(document.getElementById('editStok').value) || 0,
            kategori: document.getElementById('editKategori').value,
            deskripsi: document.getElementById('editDeskripsi').value.trim()
        };
        
        showLoading(true);
        
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    index: index,
                    data: formData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local array
                CONFIG.items[index] = formData;
                
                // Update UI
                updateDashboard();
                updateRecentItems();
                updateDataTable();
                
                // Close modal
                closeModal();
                
                showToast('Barang berhasil diperbarui', 'success');
                updateStatus('Barang berhasil diperbarui', 'success');
                
            } else {
                throw new Error(result.error || 'Gagal update data');
            }
            
        } catch (error) {
            console.error('Error updating item:', error);
            showToast('Gagal memperbarui barang', 'error');
            updateStatus(`Gagal update: ${error.message}`, 'error');
            
        } finally {
            showLoading(false);
        }
    });
    
    // Auto-refresh every 5 minutes
    setInterval(loadData, 300000);
    
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            const previewModal = document.getElementById('imagePreviewModal');
            if (previewModal) {
                previewModal.remove();
            }
        }
    });
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('editModal');
        if (event.target === modal) {
            closeModal();
        }
        
        const previewModal = document.getElementById('imagePreviewModal');
        if (previewModal && event.target === previewModal) {
            previewModal.remove();
        }
    };
}

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
/**
 * ZamboSur Crafts Admin Logic - Unified Version
 */

const API_BASE = 'https://zambosur-api-v2.onrender.com';

// 1. MAIN NAVIGATION FUNCTION
function showSection(sectionId, element, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log("Switching to section:", sectionId);

    // Hide all sections
    document.querySelectorAll('.content-body').forEach(s => {
        s.style.display = 'none';
    });

    // Show selected section
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
    }

    // Update Sidebar UI
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    // Update Page Title
    const titles = { 
        productsSection: 'Products Inventory', 
        categoriesSection: 'Categories', 
        ordersSection: 'Recent Orders', 
        usersSection: 'System Users' 
    };
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'Dashboard';
    }

    // Load Data
    if (sectionId === 'productsSection') loadProducts();
    if (sectionId === 'categoriesSection') loadCategories();
    if (sectionId === 'ordersSection') loadOrders();
    if (sectionId === 'usersSection') loadCustomers();
}

// 2. DATA LOADING FUNCTIONS
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/admin/products`, {
            credentials: 'include' 
        });
        
        const data = await res.json();
        
        if (!Array.isArray(data)) {
            console.error("Server error:", data);
            if (data.error) {
                document.getElementById('productsTable').innerHTML = `
                    <div class="error-msg">Access Denied: ${data.error}</div>
                `;
            }
            return; 
        }

        let html = `
            <div class="table-controls">
                <h3>Product Inventory (${data.length})</h3>
                <input type="text" id="productSearch" placeholder="Search products..." onkeyup="filterProducts()">
            </div>
            <table class="styled-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Product Details</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="productTableBody">`;

        data.forEach(p => {
            const isOutOfStock = p.stock <= 0;
            const bestSellerBadge = Number(p.is_best_seller) === 1 ? '<span class="badge-star">⭐ Best Seller</span>' : '';

            // CRITICAL: Added id="row-${p.id}" to the TR for the delete function to work
            html += `
                <tr id="row-${p.id}">
                    <td><img src="../${p.image_url}" class="admin-prod-img" onerror="this.src='../assets/placeholder.png'"></td>
                    <td>
                        <div class="prod-info">
                            <strong>${p.name}</strong>
                            ${bestSellerBadge}
                        </div>
                    </td>
                    <td>₱${parseFloat(p.price).toLocaleString()}</td>
                    <td><span class="category-tag">${p.category_name || 'Uncategorized'}</span></td>
                    <td>
                        <span class="stock-badge ${isOutOfStock ? 'status-red' : 'status-green'}">
                            ${isOutOfStock ? 'Out of Stock' : p.stock + ' in Stock'}
                        </span>
                    </td>
                    <td>
                        <button onclick="editProduct(${p.id})">Edit</button>
                        <button class="delete-btn" onclick="confirmDelete(${p.id})">Delete</button>
                    </td>
                </tr>`;
        });

        document.getElementById('productsTable').innerHTML = html + '</tbody></table>';
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

function filterProducts() {
    let input = document.getElementById("productSearch").value.toLowerCase();
    let rows = document.querySelectorAll("#productTableBody tr");
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
    });
}

// 3. PRODUCT ACTIONS (EDIT, SAVE, DELETE)
async function editProduct(id) {
    try {
        const res = await fetch(`${API_BASE}/admin/products/${id}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        const responseText = await res.text(); 
        if (!responseText) throw new Error("Empty response from server.");

        const product = JSON.parse(responseText);
        
        // Populate modal
        document.getElementById('edit-prod-id').value = product.id;
        document.getElementById('edit-name').value = product.name;
        document.getElementById('edit-price').value = product.price;
        document.getElementById('edit-stock').value = product.quantity || product.stock || 0;
        document.getElementById('edit-desc').value = product.description;

        const modal = document.getElementById('editModal');
        if (modal) modal.style.display = 'flex';

    } catch (err) {
        console.error("Edit Error:", err);
        alert("Error: " + err.message);
    }
}

async function saveProductEdit() {
    const id = document.getElementById('edit-prod-id').value;
    const updatedData = {
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-desc').value,
        price: parseFloat(document.getElementById('edit-price').value),
        quantity: parseInt(document.getElementById('edit-stock').value)
    };

    try {
        const res = await fetch(`${API_BASE}/admin/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
            credentials: 'include'
        });

        const result = await res.json();
        if (res.ok) {
            alert("Product updated successfully!");
            closeEditModal();
            loadProducts(); 
        } else {
            alert("Update failed: " + result.error);
        }
    } catch (err) {
        console.error("Save error:", err);
    }
}

async function confirmDelete(id) {
    if (confirm("Are you sure you want to delete this product?")) {
        try {
            const res = await fetch(`${API_BASE}/admin/products/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (res.ok) {
                const row = document.getElementById(`row-${id}`);
                if(row) row.remove();
                alert("Product deleted.");
            } else {
                const result = await res.json();
                alert("Error: " + result.error);
            }
        } catch (err) {
            console.error("Delete request failed:", err);
        }
    }
}

// 4. ADD PRODUCT LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addProductForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const formData = new FormData(this);

            fetch(`${API_BASE}/admin/products/add`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert("✅ Product added to ZamboSur Crafts!");
                    closeAddModal();
                    loadProducts();
                } else {
                    alert("❌ Error: " + (result.error || "Something went wrong"));
                }
            })
            .catch(error => {
                console.error("Fetch error:", error);
                alert("❌ Connection error.");
            });
        });
    }
});

async function loadCategories() {
    const tableContainer = document.getElementById('categoriesTable');
    
    try {
        const res = await fetch(`${API_BASE}/admin/categories`, {
            credentials: 'include'
        });
        const data = await res.json();
        
        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<p class="empty-msg">No categories found.</p>';
            return;
        }

        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Category Name</th>
                        <th style="text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>`;

        data.forEach(c => {
            html += `
                <tr>
                    <td class="id-column">#${c.id}</td>
                    <td class="name-column"><strong>${c.name}</strong></td>
                    <td class="actions-column">
                        <div class="table-actions">
                            <button class="edit-btn" onclick="openEditCategory(${c.id}, '${c.name}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="delete-btn" onclick="deleteCategory(${c.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>`;
        });

        tableContainer.innerHTML = html + '</tbody></table>';
        
    } catch (err) {
        console.error("Error loading categories:", err);
        tableContainer.innerHTML = '<p class="error-msg">Failed to load categories. Please check your connection.</p>';
    }
}

// Function to load Customers/Users from the API
async function loadCustomers() {
    const tableContainer = document.getElementById('usersTable'); // Or 'customersTable' if you added a new ID
    
    try {
        // Updated endpoint to specifically fetch customer records
        const res = await fetch(`${API_BASE}/admin/customers`, {
            credentials: 'include'
        });
        const data = await res.json();
        
        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<p class="empty-msg">No customer records found.</p>';
            return;
        }

        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Contact No.</th>
                        <th>Address</th>
                        <th style="text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>`;

        data.forEach(c => {
            html += `
                <tr>
                    <td class="id-column">#${c.id || c.customer_id}</td>
                    <td><strong>${c.first_name} ${c.last_name}</strong></td>
                    <td>${c.phone || 'N/A'}</td>
                    <td style="font-size: 0.85rem; color: #666;">${c.address || 'No address provided'}</td>
                    <td class="actions-column">
                        <div class="table-actions">
                            <button class="delete-btn" onclick="deleteCustomer(${c.id || c.customer_id}, '${c.first_name}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>`;
        });

        tableContainer.innerHTML = html + '</tbody></table>';
        
    } catch (err) {
        console.error("Error loading customers:", err);
        tableContainer.innerHTML = '<p class="error-msg">Failed to load customer database.</p>';
    }
}

// Optional: Add the delete function if you haven't yet
async function deleteCustomer(customerId, name) {
    if (!confirm(`Warning: Are you sure you want to delete customer "${name}"? This will remove their profile and contact information.`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/admin/customers/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: customerId }),
            credentials: 'include'
        });

        const result = await res.json();

        if (result.success) {
            alert("Customer record deleted.");
            loadCustomers(); // Refresh the list
        } else {
            alert("Error: " + (result.error || "Could not delete customer."));
        }
    } catch (err) {
        console.error("Delete customer error:", err);
        alert("Server error while trying to delete.");
    }
}
// 5. CUSTOMER & ORDER LOGIC
async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE}/admin/orders`, {
            credentials: 'include'
        });
        const data = await res.json();
        const ordersArray = Array.isArray(data) ? data : data.orders;

        if (!ordersArray) {
            console.error("No orders array found in response");
            return;
        }

        // Added headers for Address, Payment, and Total to match your cells
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Shipping Address</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>`;
        
        ordersArray.forEach(o => {
            html += `
                <tr>
                    <td>#${o.id}</td>
                    <td>
                        <strong>${o.customer_name || 'Guest'}</strong><br>
                        <small style="color: #666;">${o.contact_number || 'No contact'}</small>
                    </td>
                    <td style="max-width: 200px; font-size: 11px; line-height: 1.4;">
                        ${o.shipping_address || 'Not provided'}
                    </td>
                    <td><small>${o.payment_method}</small></td>
                    <td style="font-weight: bold;">₱${parseFloat(o.total_amount).toLocaleString()}</td>
                    <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
                    <td>
                        <select onchange="updateStatus(${o.id}, this.value)" class="status-select">
                            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Canceled" ${o.status === 'Canceled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                </tr>
            `;
        });
        
        document.getElementById('ordersTable').innerHTML = html + '</tbody></table>';
    } catch (err) {
        console.error("Error loading orders:", err);
        document.getElementById('ordersTable').innerHTML = `<p class="error">Failed to load orders.</p>`;
    }
}
async function updateStatus(orderId, newStatus) {
    try {
        await fetch(`${API_BASE}/admin/orders/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: newStatus }),
            credentials: 'include'
        });
        loadOrders();
    } catch (err) { console.error(err); }
}

// 6. INITIALIZATION & MODAL UTILS
window.onload = () => {
    console.log("Admin Dashboard Script Initialized");
    loadProducts();
};

function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }
function openAddModal() { document.getElementById('addProductModal').style.display = 'flex'; }
function closeAddModal() { document.getElementById('addProductModal').style.display = 'none'; }

window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const addModal = document.getElementById('addProductModal');
    if (event.target == editModal) editModal.style.display = "none";
    if (event.target == addModal) addModal.style.display = "none";
}

async function handleLogout() {
    if(confirm("Are you sure you want to log out?")) {
        const res = await fetch(`${API_BASE}/admin/logout`, { credentials: 'include' });
        const result = await res.json();
        if(result.success) {
            window.location.href = 'index.html'; // Or your login page
        }
    }
}

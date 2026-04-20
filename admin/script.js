/**
 * ZamboSur Crafts Admin Logic
 */
const API_URL = window.location.origin + 'https://zambosur-api-v2.onrender.com';
const API_BASE = 'https://zambosur-api-v2.onrender.com';

// 1. MAIN NAVIGATION FUNCTION
// Added 'event' parameter to handle link behavior
function showSection(sectionId, element, event) {
    // Prevent the default <a> tag behavior (page reload)
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
        
        // 2. SAFETY CHECK: Ensure data is an array before processing
        if (!Array.isArray(data)) {
            console.error("Server returned an object, not an array:", data);
            if (data.error) {
                document.getElementById('productsTable').innerHTML = `
                    <div class="error-msg">Access Denied: ${data.error}</div>
                `;
            }
            return; 
        }
        // Add a search/header row above the table
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
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="productTableBody">`;

        data.forEach(p => {
    const isOutOfStock = p.stock <= 0;
    const bestSellerBadge = p.is_best_seller == 1 ? '<span class="badge-star">⭐ Best Seller</span>' : '';

    html += `
        <tr>
            <td><img src="../${p.image_url}" class="admin-prod-img"></td>
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

// Simple filter feature
function filterProducts() {
    let input = document.getElementById("productSearch").value.toLowerCase();
    let rows = document.querySelectorAll("#productTableBody tr");
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
    });
}

async function loadCategories() {
    const tableContainer = document.getElementById('categoriesTable');
    
    try {
        const res = await fetch(`${API_BASE}/admin/categories`);
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

async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE}/admin/orders`);
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
    // Optional: Confirm with the admin, especially for "Delivered"
    if (newStatus === 'Delivered') {
        if (!confirm(`Marking Order #${orderId} as Delivered will send an arrival notification to the customer. Proceed?`)) {
            loadOrders(); // Refresh to reset select box
            return;
        }
    }

    try {
        const res = await fetch(`${API_BASE}/admin/orders/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: newStatus })
        });
        
        const result = await res.json();
        if (result.success) {
            console.log(`Order ${orderId} updated to ${newStatus}`);
            loadOrders(); // Refresh table to show updated badges
        } else {
            alert("Failed to update status.");
        }
    } catch (err) {
        console.error("Error updating status:", err);
    }
}

async function loadCustomers() {
    const tableContainer = document.getElementById('usersTable'); // Or 'customersTable' if you added a new ID
    
    try {
        // Updated endpoint to specifically fetch customer records
        const res = await fetch(`${API_BASE}/admin/customers`);
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

// 3. INITIALIZATION
// This ensures the code runs only after the script is fully parsed
window.onload = () => {
    console.log("Admin Dashboard Script Initialized");
    loadProducts();
};

async function confirmDelete(id) {
    if (confirm("Are you sure you want to delete this product?")) {
        try {
            const res = await fetch(`${API_BASE}/admin/products/${id}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            
            if (res.ok) {
                // Remove the row from the table immediately for a smooth UI
                document.getElementById(`row-${id}`).remove();
                alert("Product deleted successfully.");
                window.location.reload();
            } else {
                alert("Error: " + result.error);
            }
        } catch (err) {
            console.error("Delete request failed:", err);
        }
    }
}

async function editProduct(id) {
    console.log("Fetching product ID:", id);
    
    try {
        const res = await fetch(`${API_URL}/admin/products/${id}`, {
            method: 'GET',
            credentials: 'include', // Sends session cookies to PHP
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // 1. Get the response as raw text first
        const responseText = await res.text(); 
        
        // 2. Check if the text actually exists
        if (!responseText || responseText.trim() === "") {
            throw new Error("Server returned an empty response. Check if you are logged in.");
        }

        // 3. Now parse that text into a JSON object
        const product = JSON.parse(responseText);
        
        console.log("Product data received:", product);

        // 4. Populate your modal fields safely
        const elements = {
            'edit-prod-id': product.id,
            'edit-name': product.name,
            'edit-price': product.price,
            'edit-stock': product.quantity || product.stock || 0,
            'edit-desc': product.description
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) {
                el.value = value;
            } else {
                console.warn(`Warning: Element with ID "${id}" not found in HTML.`);
            }
        }

      
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.setProperty('display', 'flex', 'important');
        }

    } catch (err) {
        console.error("Full Error Debug:", err);
        alert("Error: " + err.message);
    }
}

// Function to SAVE the changes
async function saveProductEdit() {
    const id = document.getElementById('edit-prod-id').value;
    
    const updatedData = {
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-desc').value,
        price: parseFloat(document.getElementById('edit-price').value),
        quantity: parseInt(document.getElementById('edit-stock').value)
    };

    try {
        const res = await fetch(`${API_URL}/admin/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await res.json();

        if (res.ok) {
            alert("Product updated successfully!");
            document.getElementById('editModal').style.display = 'flex';
            closeEditModal();
            loadProducts(); // Refresh the table
        } else {
            alert("Update failed: " + result.error);
        }
    } catch (err) {
        console.error("Save error:", err);
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Close modal if user clicks anywhere outside of the white box
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Function to show the modal
function openAddModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.style.display = 'flex';
        // Prevent background scrolling while modal is open
        document.body.style.overflow = 'hidden';
    }
}

// Function to hide the modal
function closeAddModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Optional: Clear the form when closing
        document.getElementById('addProductForm').reset();
    }
}

// Close modal if user clicks outside the white box
window.onclick = function(event) {
    const modal = document.getElementById('addProductModal');
    if (event.target == modal) {
        closeAddModal();
    }
}

/*document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('addProductForm');

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop page from refreshing

            // 1. Gather form data (handles text, numbers, and files)
            const formData = new FormData(addProductForm);

            // 2. Optional: Log the data to see if it's correct
            // console.log("Sending data...", Object.fromEntries(formData));

            try {
                // 3. Send to your PHP router
                const response = await fetch('/zambosur_craft/backend/index.php/api/admin/products/add', {
                    method: 'POST',
                    body: formData // No headers needed for FormData
                });

                const result = await response.json();

                if (result.success) {
                    alert('Success: ' + result.message);
                    closeAddModal(); // Close the modal
                    location.reload(); // Refresh the list to show the new product
                } else {
                    alert('Error: ' + (result.error || 'Failed to add product'));
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('Connection error. Is your backend running?');
            }
        });
    }
});*/

// This waits for the form to exist in the DOM
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addProductForm');

    if (form) {
        form.addEventListener('submit', function(e) {
            // 🛑 STOP the page from refreshing
            e.preventDefault(); 

            console.log("Submit button clicked - sending to backend...");

            // 1. Collect the data
            const formData = new FormData(this);

            // 2. Send to PHP
            // Replace with your actual ngrok URL and the correct path to index.php
            fetch('https://zambosur-api-v2.onrender.comadmin/products/add', {
                method: 'POST',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                },
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                console.log("Server response:", result);
                if (result.success) {
                    alert("✅ Product added to ZamboSur Crafts!");
                    closeAddModal(); // Close the modal
                    location.reload(); // Now you can refresh to show the new item
                } else {
                    alert("❌ Error: " + (result.error || "Something went wrong"));
                }
            })
            .catch(error => {
                console.error("Fetch error:", error);
                alert("❌ Could not connect to the server.");
            });
        });
    }
});

async function deleteCustomer(customerId, name) {
    if (!confirm(`Warning: Are you sure you want to delete customer "${name}"? This will remove their profile and contact information.`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/admin/customers/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: customerId })
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

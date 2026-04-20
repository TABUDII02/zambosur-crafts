document.addEventListener('DOMContentLoaded', () => {
    loadBasketProducts();
    setupBasketFilters();
});

// Load Basket products from API
async function loadBasketProducts() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const productGrid = document.getElementById('basketGrid'); // MATCHED TO HTML

    if (loadingState) loadingState.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    if (productGrid) productGrid.innerHTML = '';

    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/products');
        const allProducts = await response.json();
        
        // FIX: Filter for "Baskets" instead of "Pillowcase"
        // Most basket categories are ID 6 in your database
        const products = allProducts.filter(product => 
            (product.category_name && product.category_name.toLowerCase().includes('basket')) || 
            product.category_id == 8 
        );

        if (loadingState) loadingState.style.display = 'none';

        if (products.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        window.allBasketData = products; // Save for filtering
        updateStats(products);
        renderBasketProducts(products);

    } catch (err) {
        console.error('Error loading basket products:', err);
        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    }
}

// Render products to grid using the .malong-card style
function renderBasketProducts(products) {
    const productGrid = document.getElementById('basketGrid');
    if (!productGrid) return;

    productGrid.innerHTML = products.map(product => `
        <article class="malong-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image_url || 'images.png'}" alt="${product.name}">
                ${parseInt(product.is_best_seller) === 1 ? '<span class="best-seller-badge">Best Seller</span>' : ''}
            </div>
            <div class="card-info">
                <h4>${product.name}</h4>
                <p>${product.description || 'Handcrafted basket from Zamboanga del Sur'}</p>
                <span class="price">Php ${parseFloat(product.price).toLocaleString()}</span>
                <div class="card-actions">
                    <button class="quick-view-btn" data-id="${product.id}">Quick View</button>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            </div>
        </article>
    `).join('');

    // --- Attach Optimized Listeners ---
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.onclick = (e) => {
            const pid = e.currentTarget.dataset.id;
            const userId = localStorage.getItem('zambosur_user_id');

            // 1. Mandatory Login Check
            if (!userId) {
            console.log("No User ID found. Attempting to open modal...");
            
            if (typeof window.openAuthModal === 'function') {
                window.openAuthModal('signin');
            } else {
                // If the modal function is missing, this alert WILL show up
                alert("Please sign in first. (Login modal function not found)");
            }
            return;
        };

            // 2. Find the basket in the current list
            const selected = products.find(p => p.id == pid || p.product_id == pid);
            if (selected) {
                // 3. Call the reliable quick add function
                quickAddToCart(selected);
            }
        };
    });

    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.onclick = (e) => {
            const pid = e.currentTarget.dataset.id;
            openQuickView(pid, products);
        };
    });
}

// Quick view modal
function openQuickView(productId, products) {
            const product = products.find(p => p.id == productId);
            if (!product) return;

            const modal = document.getElementById('quickViewModal');
            document.getElementById('modalProductImage').src = product.image_url || '2-2-ZAM-CITY-1.jpg';
            document.getElementById('modalProductName').textContent = product.name;
            document.getElementById('modalProductDesc').textContent = product.description;
            document.getElementById('modalProductPrice').textContent = 'Php ' + parseFloat(product.price).toFixed(2);
            
            const badge = document.getElementById('modalProductBadge');
            if (product.is_best_seller) {
                badge.textContent = 'Best Seller';
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }

            modal.style.display = 'flex';
}

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('quickViewModal').style.display = 'none';
});

// Close modal on outside click
document.getElementById('quickViewModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('quickViewModal')) {
                document.getElementById('quickViewModal').style.display = 'none';
            }
});

// Update dashboard statistics
function updateStats(products) {
    if (products.length === 0) return;
    
    const totalProducts = products.length;
    const bestSellers = products.filter(p => parseInt(p.is_best_seller) === 1).length;
    const prices = products.map(p => parseFloat(p.price));
    const minPrice = Math.min(...prices);

    document.getElementById('totalProducts').textContent = totalProducts;
    if(document.getElementById('bestSellers')) document.getElementById('bestSellers').textContent = bestSellers;
    document.getElementById('avgPrice').textContent = 'Php ' + minPrice.toLocaleString();
    document.getElementById('productCount').textContent = totalProducts;
}

// Filter logic (Optimized to use the global window.allBasketData)
function filterBasketProducts() {
    if (!window.allBasketData) return;

    const activeType = document.querySelector('#basketCategoryList li.active').dataset.type;
    const maxPrice = document.getElementById('priceRange').value;
    const bestSellerOnly = document.getElementById('bestSellerOnly').checked;
    const sortBy = document.getElementById('basketSort').value;

    let filtered = [...window.allBasketData];

    // Type Filter
    if (activeType !== 'all') {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(activeType) || 
            (p.description && p.description.toLowerCase().includes(activeType))
        );
    }

    // Price Filter
    filtered = filtered.filter(p => parseFloat(p.price) <= maxPrice);

    // Best Seller Filter
    if (bestSellerOnly) {
        filtered = filtered.filter(p => parseInt(p.is_best_seller) === 1);
    }

    // Sorting
    if (sortBy === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

    renderBasketProducts(filtered);
    document.getElementById('productCount').textContent = filtered.length;
}

function setupBasketFilters() {
    // Category list clicks
    const listItems = document.querySelectorAll('#basketCategoryList li');
    listItems.forEach(item => {
        item.addEventListener('click', () => {
            listItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            filterBasketProducts();
        });
    });

    // Range slider
    document.getElementById('priceRange').addEventListener('input', (e) => {
        document.getElementById('priceValue').textContent = 'Php ' + e.target.value;
        filterBasketProducts();
    });

    // Checkbox and Sort
    document.getElementById('bestSellerOnly').addEventListener('change', filterBasketProducts);
    document.getElementById('basketSort').addEventListener('change', filterBasketProducts);
}

async function quickAddToCart(product) {
    const userId = localStorage.getItem('zambosur_user_id');
    
    // 1. Prepare the data (exactly what your backend expects)
    const cartData = {
        user_id: userId,
        product_id: product.id || product.product_id,
        quantity: 1 // Default to 1 for quick-add
    };

    try {
        // 2. Call your backend directly
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartData),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            // 3. Update the UI (the red badge)
            if (typeof updateCartBadge === 'function') {
                updateCartBadge();
            }
            alert(`${product.name} added to cart!`);
        } else {
            console.error("Cart error:", result.error);
        }
    } catch (err) {
        console.error("Failed to add to cart:", err);
    }
}

async function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    const navUserName = document.getElementById('navUserName'); // 1. Add this reference
    if (!badge) return;

    let totalItems = 0;
    const userId = localStorage.getItem('zambosur_user_id');

    if (userId) {
        try {
            // Profile fetch to get the name
           const response = await fetch('https://zambosur-api-v2.onrender.com/products', {
    credentials: 'include' // <--- ADD THIS HERE
});
            const profileData = await profileRes.json();
            
            if (profileData.success && navUserName) {
                navUserName.textContent = profileData.data.name; // 2. Set the name
            }

            // Your existing cart count fetch
            const res = await fetch('https://zambosur-api-v2.onrender.com/user/cart/count');
            const data = await res.json();
            if (data.success) {
                totalItems = data.count;
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    } else {
        // Guest logic (Keep your existing code)
        if (navUserName) navUserName.textContent = "Sign In"; 
        const localCart = JSON.parse(localStorage.getItem('zambosur_cart') || '[]');
        totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);
    }

    badge.innerText = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

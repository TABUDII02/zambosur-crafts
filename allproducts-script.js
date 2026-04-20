 // All Products Dashboard JavaScript
let cachedProducts = []; // Global cache to prevent redundant API calls during filtering

document.addEventListener('DOMContentLoaded', () => {
    loadAllProducts();
    setupProductFilters();
    updateAuthUI();
});


async function loadAllProducts() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const productGrid = document.getElementById('productGrid');

    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    productGrid.innerHTML = '';

    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/products');
        cachedProducts = await response.json();

        loadingState.style.display = 'none';
        if (cachedProducts.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        updateStats(cachedProducts);
        renderProducts(cachedProducts);
    } catch (err) {
        console.error('Error loading products:', err);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

/*function updateStats(products) {
    if (products.length === 0) return;

    const prices = products.map(p => parseFloat(p.price));
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;

    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('bestSellers').textContent = products.filter(p => p.is_best_seller).length;
    document.getElementById('avgPrice').textContent = 'Php ' + average.toFixed(0);
    document.getElementById('productCount').textContent = products.length;
}*/
function renderProducts(products) {
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');

    if (products.length === 0) {
        productGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    productGrid.innerHTML = products.map(product => `
        <article class="product-card malong-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image_url || '2-2-ZAM-CITY-1.jpg'}" alt="${product.name}">
                ${product.is_best_seller ? '<span class="best-seller-badge">Best Seller</span>' : ''}
            </div>
            <div class="card-info">
                <h4>${product.name}</h4>
                <p>${product.description || 'Handcrafted product from Zamboanga del Sur'}</p>
                <span class="price">Php ${parseFloat(product.price).toFixed(2)}</span>
                <div class="card-actions">
                    <button class="quick-view-btn" data-id="${product.id}">Quick View</button>
                    <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        </article>
    `).join('');

    // --- Listeners for Quick View ---
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.onclick = (e) => openQuickView(e.target.dataset.id, products);
    });

   // --- Inside renderProducts function ---

 // --- Update your Grid Listener ---
document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.onclick = (e) => {
        const pid = e.target.dataset.id;
        const userId = localStorage.getItem('zambosur_user_id');

        if (!userId) {
            return typeof openAuthModal === 'function' ? openAuthModal('signin') : alert("Please login");
        }

        // Find the product and call our new standalone function
        const selectedProduct = products.find(p => p.id == pid || p.product_id == pid);
        if (selectedProduct) {
            quickAddToCart(selectedProduct);
        }
    };
});
}

// --- New Quick Add Function for the Dashboard ---
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

// --- Update your Grid Listener ---
document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.onclick = (e) => {
        const pid = e.target.dataset.id;
        const userId = localStorage.getItem('zambosur_user_id');

        if (!userId) {
            return typeof openAuthModal === 'function' ? openAuthModal('signin') : alert("Please login");
        }

        // Find the product and call our new standalone function
        const selectedProduct = products.find(p => p.id == pid || p.product_id == pid);
        if (selectedProduct) {
            quickAddToCart(selectedProduct);
        }
    };
});

function setupProductFilters() {
    const categoryList = document.getElementById('categoryList');
    
    categoryList.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            categoryList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            document.getElementById('categoryTitle').textContent = item.textContent;
            filterProducts();
        });
    });

    document.getElementById('priceRange').addEventListener('input', e => {
        document.getElementById('priceValue').textContent = 'Php ' + e.target.value;
        filterProducts();
    });

    // Unified listener for all filter controls
    ['bestSellerOnly', 'productSort', 'colorFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', filterProducts);
    });

    // View Toggle (Grid/List)
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const grid = document.getElementById('productGrid');
            btn.dataset.view === 'list' ? grid.classList.add('list-view') : grid.classList.remove('list-view');
        });
    });
}

function filterProducts() {
    let products = [...cachedProducts]; // Use spread to avoid mutating original cache

    const activeCat = document.querySelector('#categoryList li.active').dataset.cat;
    const maxPrice = parseFloat(document.getElementById('priceRange').value);
    const bestOnly = document.getElementById('bestSellerOnly').checked;
    const sortBy = document.getElementById('productSort').value;
    const color = document.getElementById('colorFilter').value;

    // Filter Logic
    if (activeCat !== 'all') {
        products = products.filter(p => p.category_name.toLowerCase().replace(' ', '-') === activeCat);
    }
    products = products.filter(p => parseFloat(p.price) <= maxPrice);
    if (bestOnly) products = products.filter(p => p.is_best_seller);
    if (color !== 'all') products = products.filter(p => p.name.toLowerCase().includes(color.toLowerCase()));

    // Sort Logic
    switch(sortBy) {
        case 'price-low': products.sort((a,b)=>parseFloat(a.price)-parseFloat(b.price)); break;
        case 'price-high': products.sort((a,b)=>parseFloat(b.price)-parseFloat(a.price)); break;
        case 'name': products.sort((a,b)=>a.name.localeCompare(b.name)); break;
    }

    document.getElementById('productCount').textContent = products.length;
    renderProducts(products);
    console.log("Current Categories in DB:", cachedProducts.map(p => p.category_name));
console.log("Active Sidebar Category:", activeCat);
}

function openQuickView(id, products) {
    const product = products.find(p => p.id == id);
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

        // ============================================
        // AUTHENTICATION JAVASCRIPT
        // ============================================
        
        // Auth Modal Functions
        const authOverlay = document.getElementById('authOverlay');
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');
        const closeAuthBtn = document.getElementById('closeAuth');

        // Function to open modal
        window.openAuthModal = (type = 'signin') => {
            authOverlay.style.display = 'flex';
            if (type === 'signin') {
                signInForm.classList.remove('hidden');
                signUpForm.classList.add('hidden');
            } else {
                signInForm.classList.add('hidden');
                signUpForm.classList.remove('hidden');
            }
        };

        closeAuthBtn.onclick = () => authOverlay.style.display = 'none';

        // Switch between Sign In and Sign Up
        document.getElementById('toSignIn').onclick = () => openAuthModal('signin');
        document.querySelector('.back-link').onclick = () => openAuthModal('signup');

        // Handle Sign Up
        const signUpBtn = document.querySelector('#signUpForm .continue-btn');
        if (signUpBtn) {
            signUpBtn.addEventListener('click', async () => {
                const fullname = document.getElementById('regName').value.trim();
                const email = document.getElementById('regEmail').value.trim();
                const password = document.getElementById('regPass').value;
                const confirmPassword = document.getElementById('regPassConfirm').value;

                if (!fullname || !email || !password || !confirmPassword) {
                    alert('Please fill in all fields');
                    return;
                }

                if (password !== confirmPassword) {
                    alert('Passwords do not match');
                    return;
                }

                if (password.length < 6) {
                    alert('Password must be at least 6 characters long');
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    alert('Please enter a valid email address');
                    return;
                }

                signUpBtn.disabled = true;
                signUpBtn.textContent = 'Creating Account...';

                try {
                    const response = await fetch('https://zambosur-api-v2.onrender.com/auth/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fullname, email, password }),
                        credentials: 'include'
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert('Account created successfully! Please sign in.');
                        openAuthModal('signin');
                    } else {
                        alert(data.error || 'Registration failed. Please try again.');
                    }
                } catch (error) {
                    console.error('Signup error:', error);
                } finally {
                    signUpBtn.disabled = false;
                    signUpBtn.textContent = 'Continue';
                }
            });
        }

        // Handle Sign In
        const signInBtn = document.querySelector('#signInForm .continue-btn');
        if (signInBtn) {
            signInBtn.addEventListener('click', async () => {
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPass').value;

                if (!email || !password) {
                    alert('Please enter both email and password');
                    return;
                }

                signInBtn.disabled = true;
                signInBtn.textContent = 'Signing In...';

                try {
                    const response = await fetch('https://zambosur-api-v2.onrender.com/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                        credentials: 'include'
                    });

                    const data = await response.json();

                    if (response.ok) {
                        localStorage.setItem('zambosur_user_name', data.user.name);
                        localStorage.setItem('zambosur_user_id', data.user.id);
                        localStorage.setItem('zambosur_user_email', email);

                        refreshNavProfile();
                        alert(`Welcome back, ${data.user.name}!`);
                        document.getElementById('authOverlay').style.display = 'none';
                    } else {
                        alert(data.error || 'Login failed. Please check your credentials.');
                    }
                } catch (error) {
                    console.error('Signin error:', error);
                } finally {
                    signInBtn.disabled = false;
                    signInBtn.textContent = 'Continue';
                }
            });
        }

        // Auth UI Update Function
        function updateAuthUI() {
            const userName = localStorage.getItem('zambosur_user_name');
            const userProfile = document.getElementById('userProfile');
            const userNameDisplay = document.getElementById('userNameDisplay');
            
            if (userName) {
                userNameDisplay.textContent = `Hello, ${userName}`;
                userProfile.style.display = 'inline-flex';
                userProfile.classList.remove('login-mode');
            } else {
                userNameDisplay.textContent = 'Login';
                userProfile.style.display = 'inline-flex';
                userProfile.classList.add('login-mode');
            }
        }

        // Handle Profile Options
        const profileOptions = document.querySelectorAll('.profile-option');
        profileOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.target.textContent;
                switch(action) {
                    case 'My Profile':
                        window.location.href = 'profile.html';
                        break;
                    case 'My Orders':
                        alert('Orders feature coming soon!');
                        break;
                    case 'Logout':
                        localStorage.removeItem('zambosur_user_name');
                        localStorage.removeItem('zambosur_user_id');
                        localStorage.removeItem('zambosur_user_email');
                        updateAuthUI();
                        location.reload();
                        break;
                }
            });
        });

        // Handle login click on profile
        const userProfile = document.getElementById('userProfile');
        userProfile.addEventListener('click', () => {
            if (userProfile.classList.contains('login-mode')) {
                openAuthModal('signin');
            }
        });

        // Check auth status on page load
        updateAuthUI();

async function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    const navUserName = document.getElementById('navUserName'); // 1. Add this reference
    if (!badge) return;

    let totalItems = 0;
    const userId = localStorage.getItem('zambosur_user_id');

    if (userId) {
        try {
            // Profile fetch to get the name
           const profileRes = await fetch('https://zambosur-api-v2.onrender.com/auth/profile', {
    credentials: 'include' // <--- ADD THIS
});
            const profileData = await profileRes.json();
            
            if (profileData.success && navUserName) {
                navUserName.textContent = profileData.data.name; // 2. Set the name
            }

            // Your existing cart count fetch
            const res = await fetch('https://zambosur-api-v2.onrender.com/user/cart/count', {
    credentials: 'include' // <--- ADD THIS
});
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

async function refreshNavProfile() {
    const nameSpan = document.getElementById('navUserName');
    if (!nameSpan) return;

    try {
        // Corrected the parenthesis and comma here
        const response = await fetch('https://zambosur-api-v2.onrender.com/auth/profile', {
            credentials: 'include'
        });
        const result = await response.json();

        if (result.success) {
            nameSpan.textContent = result.data.name || result.data.full_name;
        } else {
            nameSpan.textContent = "Guest";
        }
    } catch (error) {
        console.error("Profile sync failed:", error);
    }
}
// Run this when the page loads
document.addEventListener('DOMContentLoaded', () => {
    refreshNavProfile();
    // Also call your existing badge function
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://zambosur-api-v2.onrender.com/auth/logout', { 
                method: 'POST',
                credentials: 'include' 
            });
            const result = await response.json(); // Now 'response' is defined
            
            if (result.success) {
                localStorage.removeItem('zambosur_user_id');
                localStorage.removeItem('zambosur_user_name');
                window.location.reload(); 
            }
        } catch (error) {
            console.error("Logout failed:", error);
        }
    });
}

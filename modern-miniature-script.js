document.addEventListener('DOMContentLoaded', () => {
    loadMiniatureProducts();
    setupMiniatureFilters();
});

// Global state to hold products for filtering without re-fetching from DB
let allMiniatures = [];

async function loadMiniatureProducts() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    try {
        const response = await fetch('backend/index.php/api/products');
        const data = await response.json();
        
        // Consistent Filtering: matches category name or specific ID
        allMiniatures = data.filter(p => 
            (p.category_name && p.category_name.toLowerCase().includes('miniature')) || 
            p.category_id == 8 
        );

        if (loadingState) loadingState.style.display = 'none';

        if (allMiniatures.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        updateStats(allMiniatures);
        renderMiniatureProducts(allMiniatures);

    } catch (err) {
        console.error('Error:', err);
        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    }
}

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
                    const response = await fetch('backend/index.php/api/auth/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fullname, email, password })
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
                    const response = await fetch('/zambosur_craft/backend/index.php/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
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

function renderMiniatureProducts(products) {
    const productGrid = document.getElementById('miniatureGrid');
    if (!productGrid) return;

    if (products.length === 0) {
        productGrid.innerHTML = '';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }

    document.getElementById('emptyState').style.display = 'none';
    productGrid.innerHTML = products.map(product => `
        <article class="product-card malong-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image_url || 'miniature-placeholder.jpg'}" alt="${product.name}">
                ${(product.is_best_seller == 1) ? '<span class="best-seller-badge">Top Pick</span>' : ''}
            </div>
            <div class="card-info">
                <h4>${product.name}</h4>
                <p>${product.description || 'Hand-carved wooden replica.'}</p>
                <span class="price">Php ${parseFloat(product.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <div class="card-actions">
                <button class="quick-view-btn" data-id="${product.id}">Quick View</button>
                    <button class="add-to-cart">Add to Cart</button>
                </div>
            </div>
        </article>
    `).join('');

    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.onclick = (e) => {
            const productId = e.currentTarget.getAttribute('data-id');
            // Pass the current products array so the modal can find the details
            openQuickView(productId, products);
        };
    });

    // --- Attach Listeners ---
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.onclick = (e) => {
            const pid = e.currentTarget.dataset.id;
            const userId = localStorage.getItem('zambosur_user_id');

            // 1. Check Login
            if (!userId) {
                if (typeof window.openAuthModal === 'function') {
                    window.openAuthModal('signin');
                } else {
                    alert("Please sign in to continue.");
                }
                return;
            }

            // 2. Find the product details
            const selected = products.find(p => p.id == pid || p.product_id == pid);
            if (selected) {
                // 3. Call the quick add function
                quickAddToCart(selected);
            }
        };
    });
}

function updateStats(products) {
    if (!products.length) return;
    
    const prices = products.map(p => parseFloat(p.price));
    const bestSellers = products.filter(p => p.is_best_seller == 1).length;

    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('bestSellers').textContent = bestSellers;
    document.getElementById('avgPrice').textContent = 'Php ' + Math.min(...prices).toLocaleString();
    document.getElementById('productCount').textContent = products.length;
}

function setupMiniatureFilters() {
    const priceRange = document.getElementById('priceRange');
    const sortSelect = document.getElementById('malongSort');
    const woodFilter = document.getElementById('colorFilter'); // Reusing ID for Wood Type
    const topPickCheck = document.getElementById('bestSellerOnly');

    // Price Slider Listener
    priceRange.addEventListener('input', (e) => {
        document.getElementById('priceValue').textContent = 'Php ' + parseInt(e.target.value).toLocaleString();
        applyFilters();
    });

    // Category List Listener
    document.querySelectorAll('#miniatureCategoryList li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('#miniatureCategoryList li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            document.getElementById('miniatureCategoryTitle').textContent = item.textContent;
            applyFilters();
        });
    });

    // Sort and Wood Type Listeners
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);
    if (woodFilter) woodFilter.addEventListener('change', applyFilters);
    if (topPickCheck) topPickCheck.addEventListener('change', applyFilters);
}

function applyFilters() {
    const activeType = document.querySelector('#miniatureCategoryList li.active').dataset.type;
    const maxPrice = parseFloat(document.getElementById('priceRange').value);
    const selectedWood = document.getElementById('colorFilter').value;
    const onlyTopPicks = document.getElementById('bestSellerOnly').checked;
    const sortBy = document.getElementById('malongSort').value;

    let filtered = allMiniatures.filter(p => {
        const matchesCategory = activeType === 'all' || p.name.toLowerCase().includes(activeType.toLowerCase());
        const matchesPrice = parseFloat(p.price) <= maxPrice;
        const matchesWood = selectedWood === 'all' || (p.description && p.description.toLowerCase().includes(selectedWood.toLowerCase()));
        const matchesTopPick = !onlyTopPicks || p.is_best_seller == 1;

        return matchesCategory && matchesPrice && matchesWood && matchesTopPick;
    });

    // Apply Sorting
    if (sortBy === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

    renderMiniatureProducts(filtered);
    document.getElementById('productCount').textContent = filtered.length;
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
        const response = await fetch('/zambosur_craft/backend/index.php/api/user/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartData)
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
            const profileRes = await fetch('/zambosur_craft/backend/index.php/api/auth/profile');
            const profileData = await profileRes.json();
            
            if (profileData.success && navUserName) {
                navUserName.textContent = profileData.data.name; // 2. Set the name
            }

            // Your existing cart count fetch
            const res = await fetch('/zambosur_craft/backend/index.php/api/user/cart/count');
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

// Pillowcase Dashboard Specific JavaScript
document.addEventListener('DOMContentLoaded', () => {
            loadPillowcaseProducts();
            setupPillowcaseFilters();
        });

// Load Pillowcase products from API
async function loadPillowcaseProducts() {
    const productGrid = document.getElementById('pillowcaseGrid');
    const emptyState = document.getElementById('emptyState');

    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/products');
        const result = await response.json();
        
        // FIX: Check if 'result' is the array itself, or if it's inside 'result.data'
        let allProducts = Array.isArray(result) ? result : (result.data || []);

        console.log("Data received:", allProducts);

        // Now .filter will work because we ensured allProducts is an Array
        const products = allProducts.filter(product => {
            const isCategoryId7 = String(product.category_id) === "7";
            const isCategoryNameMatch = product.category_name && 
                                        product.category_name.toLowerCase().includes('pillow');
            return isCategoryId7 || isCategoryNameMatch;
        });

        // Store the array globally for your sidebar filters
        window.allPillowcaseData = products; 

        if (products.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            productGrid.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        renderPillowcaseProducts(products);
        updateStats(products);

    } catch (err) {
        console.error('Fetch Error:', err);
        if (emptyState) emptyState.style.display = 'block';
    }
}
        // Update dashboard statistics
function updateStats(products) {
            const totalProducts = products.length;
            const bestSellers = products.filter(p => p.is_best_seller).length;
            const prices = products.map(p => parseFloat(p.price));
            const minPrice = Math.min(...prices);

            document.getElementById('totalProducts').textContent = totalProducts;
            document.getElementById('bestSellers').textContent = bestSellers;
            document.getElementById('avgPrice').textContent = 'Php ' + minPrice.toFixed(0);
            document.getElementById('productCount').textContent = totalProducts;
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
                    const response = await fetch('https://zambosur-api-v2.onrender.com/auth/signup', {
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
                    const response = await fetch('https://zambosur-api-v2.onrender.com/auth/login', {
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

// Render products to grid
function renderPillowcaseProducts(products) {
    const productGrid = document.getElementById('pillowcaseGrid');
    
    productGrid.innerHTML = products.map(product => `
        <article class="malong-card">
            <div class="product-image">
                <img src="${product.image_url || '2-2-ZAM-CITY-1.jpg'}" alt="${product.name}">
                ${parseInt(product.is_best_seller) === 1 ? '<span class="best-seller-badge">Best Seller</span>' : ''}
            </div>
            <div class="card-info">
                <h4>${product.name}</h4>
                <p>${product.description || 'Authentic ZamboSur handcrafted pillowcase.'}</p>
                <span class="price">Php ${parseFloat(product.price).toLocaleString()}</span>
                <div class="card-actions">
                    <button class="quick-view-btn" data-id="${product.id}">Quick View</button>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            </div>
        </article>
    `).join('');

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.onclick = (e) => {
        const pid = e.currentTarget.dataset.id;
        
        // 1. Get the User ID from local storage
        const userId = localStorage.getItem('zambosur_user_id');

        // 2. If no user, show the login modal and STOP
        if (!userId) {
            if (typeof openAuthModal === 'function') {
                openAuthModal('signin'); // Opens your existing modal from script.js
            } else {
                alert("Please sign in to add items to your cart.");
            }
            return; // Stop the function here so it doesn't try to fetch
        }

        // 3. If user is logged in, find the product and add it
        const selected = products.find(p => p.id == pid || p.product_id == pid);
        if (selected) {
            quickAddToCart(selected);
        }
    };
});

    // --- Quick View Logic ---
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.onclick = (e) => {
            const pid = e.currentTarget.dataset.id;
            // Ensure openQuickView is defined in script.js and accepts (id, productArray)
            if (typeof openQuickView === 'function') {
                openQuickView(pid, products);
            } else {
                console.error("openQuickView function not found in script.js");
            }
        };
    });
}


// Get pillowcase type from product name
function getPillowcaseType(name) {
            const nameLower = name.toLowerCase();
            if (nameLower.includes('traditional')) return 'traditional';
            if (nameLower.includes('premium')) return 'premium';
            if (nameLower.includes('classic')) return 'classic';
            if (nameLower.includes('wedding')) return 'wedding';
            if (nameLower.includes('festival')) return 'festival';
            if (nameLower.includes('daily')) return 'daily';
            return 'all';
}

 // Setup filter functionality
function setupPillowcaseFilters() {
            // Category type filter
            const categoryList = document.getElementById('pillowcaseCategoryList');
            categoryList.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', () => {
                    categoryList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                    item.classList.add('active');
                    
                    const type = item.dataset.type;
                    document.getElementById('pillowcaseCategoryTitle').textContent = item.textContent;
                    filterPillowcaseProducts();
                });
            });

            // Price range filter
            const priceRange = document.getElementById('priceRange');
            priceRange.addEventListener('input', (e) => {
                document.getElementById('priceValue').textContent = 'Php ' + e.target.value;
                filterPillowcaseProducts();
            });

            // Best seller filter
            document.getElementById('bestSellerOnly').addEventListener('change', filterPillowcaseProducts);

            // Sort filter
            document.getElementById('pillowcaseSort').addEventListener('change', filterPillowcaseProducts);

            // Color filter
            document.getElementById('colorFilter').addEventListener('change', filterPillowcaseProducts);

            // View toggle
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const grid = document.getElementById('pillowcaseGrid');
                    if (btn.dataset.view === 'list') {
                        grid.classList.add('list-view');
                    } else {
                        grid.classList.remove('list-view');
                    }
                });
            });
}

// Filter products based on all filters
function filterPillowcaseProducts() {
    // Check if the data exists and is an array
    if (!window.allPillowcaseData || !Array.isArray(window.allPillowcaseData)) {
        console.warn("No pillowcase data available to filter yet.");
        return;
    }

    const activeType = document.querySelector('#pillowcaseCategoryList li.active').dataset.type;
    const maxPrice = document.getElementById('priceRange').value;
    
    let filtered = [...window.allPillowcaseData]; // Use a copy of the array

    if (activeType !== 'all') {
        filtered = filtered.filter(p => 
            (p.name && p.name.toLowerCase().includes(activeType)) || 
            (p.description && p.description.toLowerCase().includes(activeType))
        );
    }

    filtered = filtered.filter(p => parseFloat(p.price) <= maxPrice);

    renderPillowcaseProducts(filtered);
    
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = `${filtered.length} products found`;
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

document.addEventListener('DOMContentLoaded', () => {
    const categoryItems = document.querySelectorAll('#pillowcaseCategoryList li');
    const categoryTitle = document.getElementById('pillowcaseCategoryTitle');

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Remove 'active' class from all items
            categoryItems.forEach(li => li.classList.remove('active'));
            
            // 2. Add 'active' class to the clicked item
            item.classList.add('active');

            // 3. Update the display title (if you have one)
            if (categoryTitle) {
                categoryTitle.textContent = item.textContent;
            }

            // 4. Trigger the filter function
            // This calls the function you likely have defined for filtering
            if (typeof filterPillowcaseProducts === 'function') {
                filterPillowcaseProducts();
            }
        });
    });
});

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
            const profileRes = await fetch('https://zambosur-api-v2.onrender.com/auth/profile');
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

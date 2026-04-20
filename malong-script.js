

        // --- GLOBAL STATE ---
let allMalongsRaw = []; // This stores the original data from the database

async function loadMalongProducts() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    loadingState.style.display = 'flex';
    
    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/products');
        const data = await response.json();

        // Standardize data format
        const allProducts = Array.isArray(data) ? data : (data.products || []);

        // Store ONLY malongs in our global state
        allMalongsRaw = allProducts.filter(product => 
            (product.category_name && product.category_name.toLowerCase().includes('malong')) || 
            product.category_id == 6
        );

        loadingState.style.display = 'none';

        if (allMalongsRaw.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        updateStats(allMalongsRaw);
        renderMalongProducts(allMalongsRaw);

    } catch (err) {
        console.error('Initial load failed:', err);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Optimized Filtering (No Fetching!)
function filterMalongProducts() {
    // 1. Get current filter values
    const activeType = document.querySelector('#malongCategoryList li.active').dataset.type;
    const maxPrice = parseFloat(document.getElementById('priceRange').value);
    const bestSellerOnly = document.getElementById('bestSellerOnly').checked;
    const sortBy = document.getElementById('malongSort').value;
    const colorFilter = document.getElementById('colorFilter').value;

    // 2. Filter the GLOBAL state variable
    let filteredResults = allMalongsRaw.filter(p => {
        const matchesType = activeType === 'all' || getMalongType(p.name) === activeType;
        const matchesPrice = parseFloat(p.price) <= maxPrice;
        const matchesBestSeller = !bestSellerOnly || (p.is_best_seller == 1 || p.is_best_seller == "1");
        const matchesColor = colorFilter === 'all' || p.name.toLowerCase().includes(colorFilter.toLowerCase());

        return matchesType && matchesPrice && matchesBestSeller && matchesColor;
    });

    // 3. Sort
    if (sortBy === 'price-low') filteredResults.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') filteredResults.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') filteredResults.sort((a, b) => a.name.localeCompare(b.name));

    // 4. Update UI
    document.getElementById('productCount').textContent = filteredResults.length;
    renderMalongProducts(filteredResults);
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

        // Render products to grid
function renderMalongProducts(products) {
    const productGrid = document.getElementById('malongGrid');
    
    // We define a reliable placeholder. 
    // You can use your '2-2-ZAM-CITY-1.jpg' or an online one.
    const fallbackImage = '2-2-ZAM-CITY-1.jpg'; 

    productGrid.innerHTML = products.map(product => `
        <article class="product-card malong-card" data-id="${product.id}" data-type="${getMalongType(product.name)}">
            <div class="product-image">
                <img src="${product.image_url || fallbackImage}" 
                     alt="${product.name}" 
                     onerror="this.onerror=null; this.src='${fallbackImage}';">
                
                ${(product.is_best_seller == 1 || product.is_best_seller == "1") 
                    ? '<span class="best-seller-badge">Best Seller</span>' 
                    : ''}
            </div>
            <div class="card-info">
                <h4>${product.name}</h4>
                <p>${product.description || 'Handwoven traditional malong from Zamboanga del Sur'}</p>
                <span class="price">Php ${parseFloat(product.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <div class="card-actions">
                    <button class="quick-view-btn" data-id="${product.id}">Quick View</button>
                    <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        </article>
    `).join('');

    // Re-attach listeners for the new buttons
    // Inside renderMalongProducts find the listener part:
document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.onclick = (e) => {
            const productId = e.currentTarget.getAttribute('data-id');
            // Pass the current products array so the modal can find the details
            openQuickView(productId, products);
        };
    });

// Add to Cart event listeners
document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const productId = e.currentTarget.dataset.id;
        
        // 1. Check for Login first
        const userId = localStorage.getItem('zambosur_user_id');
        if (!userId) {
            // Check if openAuthModal exists in script.js
            return typeof openAuthModal === 'function' ? openAuthModal('signin') : alert("Please sign in first.");
        }

        // 2. Find the product object from your current list
        const selected = products.find(p => p.id == productId);

        if (selected) {
            // 3. Call your NEW independent function
            // No more "Please select a product" error because we pass 'selected' directly!
            quickAddToCart(selected);
        } else {
            console.error("Product not found in the local array.");
        }
    });
});
}

        // Get malong type from product name
function getMalongType(name) {
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
 function setupMalongFilters() {
            // Category type filter
            const categoryList = document.getElementById('malongCategoryList');
            categoryList.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', () => {
                    categoryList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                    item.classList.add('active');
                    
                    const type = item.dataset.type;
                    document.getElementById('malongCategoryTitle').textContent = item.textContent;
                    filterMalongProducts();
                });
            });

            // Price range filter
            const priceRange = document.getElementById('priceRange');
            priceRange.addEventListener('input', (e) => {
                document.getElementById('priceValue').textContent = 'Php ' + e.target.value;
                filterMalongProducts();
            });

            // Best seller filter
            document.getElementById('bestSellerOnly').addEventListener('change', filterMalongProducts);

            // Sort filter
            document.getElementById('malongSort').addEventListener('change', filterMalongProducts);

            // Color filter
            document.getElementById('colorFilter').addEventListener('change', filterMalongProducts);

            // View toggle
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const grid = document.getElementById('malongGrid');
                    if (btn.dataset.view === 'list') {
                        grid.classList.add('list-view');
                    } else {
                        grid.classList.remove('list-view');
                    }
                });
            });
}

        // Filter products based on all filters
        

        // Quick view modal
function openQuickView(productId, products) {
    // 1. Safety check: Ensure products is a valid array
    if (!Array.isArray(products)) {
        console.error("QuickView Error: 'products' is not an array", products);
        return;
    }

    // 2. Find the product (using == to handle both string and number IDs)
    const product = products.find(p => p.id == productId);
    
    if (!product) {
        console.error("QuickView Error: Product not found for ID:", productId);
        return;
    }

    const modal = document.getElementById('quickViewModal');
    if (!modal) {
        console.error("QuickView Error: Element 'quickViewModal' not found in HTML");
        return;
    }

    // 3. Update the Modal content
    const modalImg = document.getElementById('modalProductImage');
    const modalName = document.getElementById('modalProductName');
    const modalDesc = document.getElementById('modalProductDesc');
    const modalPrice = document.getElementById('modalProductPrice');
    const modalBadge = document.getElementById('modalProductBadge');
    const modalAddToCartBtn = document.querySelector('.quick-view-modal .add-to-cart-btn');

    if (modalImg) modalImg.src = product.image_url || '2-2-ZAM-CITY-1.jpg';
    if (modalName) modalName.textContent = product.name;
    if (modalDesc) modalDesc.textContent = product.description || 'Traditional handcrafted malong.';
    if (modalPrice) {
        const price = parseFloat(product.price) || 0;
        modalPrice.textContent = 'Php ' + price.toLocaleString(undefined, {minimumFractionDigits: 2});
    }

    if (modalAddToCartBtn) {
    modalAddToCartBtn.onclick = () => {
        // This will now trigger the auth check automatically
        addToCart(productId); 
    };
}
    
    // 4. Handle the Badge
    if (modalBadge) {
        if (product.is_best_seller == 1 || product.is_best_seller == "1") {
            modalBadge.textContent = 'Best Seller';
            modalBadge.style.display = 'inline-block';
        } else {
            modalBadge.style.display = 'none';
        }
    }

    // 5. Show the modal
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


        // Remove the separate listener blocks and put this at the very bottom of malong-script.js
        document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Data
    loadMalongProducts();
    setupMalongFilters();

    // 2. Hamburger Menu Logic
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.onclick = () => {
            const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
            hamburgerBtn.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('active');
        };
    }

    // 3. Modal Close Logic (Extra Safety)
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('quickViewModal').style.display = 'none';
        };
    }
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
            body: JSON.stringify(cartData),
            credentials: 'include"
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

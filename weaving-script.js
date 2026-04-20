document.addEventListener('DOMContentLoaded', () => {
    loadWeavingProducts();
    setupFilters();
});

// Use a global variable to store the filtered list for live filtering
let weavingCollection = [];

async function loadWeavingProducts() {
    const grid = document.getElementById('weavingGrid');
    const loading = document.getElementById('loadingState');
    
    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/products');
        const all = await response.json();
        
        // 1. IMPROVED FILTER: Checks both name and ID
        // Ensure ID 7 or 8 matches your "Weaving" category in the DB
        weavingCollection = all.filter(p => 
            (p.category_name && p.category_name.toLowerCase().includes('weaving')) || 
            p.category_id == 7 
        );

        if (loading) loading.style.display = 'none';

        if (weavingCollection.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }

        updateStats(weavingCollection);
        renderProducts(weavingCollection);
    } catch (err) {
        console.error('Failed to load weaving:', err);
        if (loading) loading.innerHTML = "<p>Unable to load collection.</p>";
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

function renderProducts(products) {
    const grid = document.getElementById('weavingGrid');
    if (!grid) return;

    grid.innerHTML = products.map(p => `
        <article class="product-card malong-card">
            <div class="product-image">
                <img src="${p.image_url || 'default-weave.jpg'}" alt="${p.name}">
                ${(p.is_best_seller == 1 || p.is_best_seller === true) ? '<span class="best-seller-badge">Masterpiece</span>' : ''}
            </div>
            <div class="card-info">
                <h4>${p.name}</h4>
                <p>${p.description || 'Traditional hand-loomed fabric.'}</p>
                <span class="price">Php ${parseFloat(p.price).toLocaleString()}</span>
                <div class="card-actions">
                <button class="quick-view-btn" data-id="${p.id}">Quick View</button>
                    <button class="add-to-cart-btn">Add to Cart</button>
                </div>
            </div>
        </article>
    `).join('');

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

    // --- Attach Listeners ---
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.onclick = (e) => {
            const pid = e.currentTarget.dataset.id;
            const userId = localStorage.getItem('zambosur_user_id');

            // 1. Check Login using the safer window function
            if (!userId) {
                if (typeof window.openAuthModal === 'function') {
                    window.openAuthModal('signin');
                } else {
                    alert("Please sign in to purchase these weavings.");
                }
                return;
            }

            // 2. Find the product
            const selected = products.find(product => product.id == pid || product.product_id == pid);
            
            if (selected) {
                // 3. Call your quick add function
                quickAddToCart(selected);
            }
        };
    });
}

function updateStats(products) {
    if (!products.length) return;

    const prices = products.map(p => parseFloat(p.price));
    const bestSellersCount = products.filter(p => p.is_best_seller == 1).length;

    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('bestSellers').textContent = bestSellersCount;
    document.getElementById('avgPrice').textContent = 'Php ' + Math.min(...prices).toLocaleString();
    document.getElementById('productCount').textContent = products.length;
}

function setupFilters() {
    // Price Range Listener
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            document.getElementById('priceValue').textContent = 'Php ' + parseInt(e.target.value).toLocaleString();
            applyActiveFilters(); // Live filter as you slide
        });
    }

    // Category List Listener
    document.querySelectorAll('#weavingCategoryList li').forEach(li => {
        li.addEventListener('click', function() {
            document.querySelectorAll('#weavingCategoryList li').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const title = document.getElementById('malongCategoryTitle');
            if (title) title.textContent = this.textContent;
            
            applyActiveFilters();
        });
    });
}

// 3. ADDED: This function actually handles the logic when you click/slide filters
function applyActiveFilters() {
    const activeType = document.querySelector('#weavingCategoryList li.active').dataset.type;
    const maxPrice = parseFloat(document.getElementById('priceRange').value);
    
    const filtered = weavingCollection.filter(p => {
        const matchesType = activeType === 'all' || p.name.toLowerCase().includes(activeType.toLowerCase());
        const matchesPrice = parseFloat(p.price) <= maxPrice;
        return matchesType && matchesPrice;
    });

    renderProducts(filtered);
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

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Category Filtering Logic ---
    const filterButtons = document.querySelectorAll('.all-parent div');
    const productCards = document.querySelectorAll('.frame-parent5'); // Adjust based on your product container

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active style from others
            filterButtons.forEach(btn => btn.style.color = "black");
            button.style.color = "red"; // Highlight selected

            const filterValue = button.textContent.trim().toLowerCase();
            // Logic to filter products would go here if you have data-tags on your cards
        });
    });

    // --- 2. Smooth Scrolling for Nav Links ---
    const navLinks = document.querySelectorAll('.bags-parent div');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const sectionName = link.textContent.trim();
            if(sectionName === "About Us") {
                document.querySelector('.about-us-parent').scrollIntoView({ behavior: 'smooth' });
            }
            // Add more section mappings here
        });
    });

    // --- Updated Contact Form Submission ---
const contactForm = document.querySelector('.frame-23');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Getting values by ID (matches your index.html)
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        const formData = { firstName, lastName, email, message };

        try {
            const response = await fetch('https://zambosur-api-v2.onrender.com/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Message sent to ZamboSur Crafts!");
                contactForm.reset();
            }
        } catch (err) {
            alert("Error: Make sure your Node.js server is running.");
        }
    });
}

    // --- 4. Back to Top Functionality ---
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.humberger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    // Create the overlay if it doesn't exist
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);
    }

    const toggleMenu = (forceClose = false) => {
        const isOpen = forceClose ? false : mobileMenu.classList.toggle('active');
        
        if (forceClose) {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
        } else {
            overlay.classList.toggle('active');
        }
        
        menuBtn.setAttribute('aria-expanded', mobileMenu.classList.contains('active'));
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    };

    // --- NEW: Global Click Listener for the Overlay ---
    overlay.addEventListener('click', () => {
        toggleMenu(true); // Always force close when clicking the overlay
    });

    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents immediate closing
            toggleMenu();
        });
    }

    // Close menu when a link is clicked
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => toggleMenu(true));
    });



    // --- 2. CAROUSEL (SLIDER) ---
    // Targets your .slider section and navigation buttons
    const slider = document.querySelector('.slider');
    if (slider) {
        const slides = slider.querySelectorAll('.slide, .image-wrapper');
        const prevBtn = slider.querySelector('.arrows');
        const nextBtn = slider.querySelector('.chevron-right-wrapper');
        const dots = slider.querySelectorAll('.navigation button');
        let currentIndex = 0;

        function updateSlider(index) {
            // Update slides visibility
            slides.forEach((slide, i) => {
                slide.style.display = (i === index) ? 'block' : 'none';
            });
            // Update dots (ellipses) opacity
            dots.forEach((dot, i) => {
                dot.style.opacity = (i === index) ? '1' : '0.2';
                dot.setAttribute('aria-selected', i === index);
            });
            currentIndex = index;
        }

        // Initialize first slide
        updateSlider(0);

        nextBtn?.addEventListener('click', () => {
            let next = (currentIndex + 1) % slides.length;
            updateSlider(next);
        });

        prevBtn?.addEventListener('click', () => {
            let prev = (currentIndex - 1 + slides.length) % slides.length;
            updateSlider(prev);
        });

        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => updateSlider(index));
        });

        // Optional: Auto-play every 5 seconds
        setInterval(() => {
            let next = (currentIndex + 1) % slides.length;
            updateSlider(next);
        }, 5000);
    }

    // --- 3. THE MAP ---
    // Targets the .rectangle-29 div in your footer area
    const mapElement = document.querySelector('.map-container');
    if (mapElement) {
        mapElement.id = 'map-container'; // Assign ID for Leaflet
        
        // Coordinates for Zamboanga del Sur region
        const map = L.map('map-container').setView([7.8939, 123.4332], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        L.marker([7.8939, 123.4332]).addTo(map)
            .bindPopup('<b>ZamboSur Crafts</b><br>Zamboanga del Sur, Philippines')
            .openPopup();
    }
});

async function loadBestSellers() {
    
    const container = document.getElementById('best-sellers-list');
    if (!container) return;

    // Show a loading message so you know the script is running
    container.innerHTML = '<p style="grid-column: span 6; text-align: center;">Loading our best crafts...</p>';

    try {
        // Use the absolute root path to avoid 404s
       const response = await fetch('https://zambosur-api-v2.onrender.com/products/best-sellers');
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status} - Check if XAMPP is running`);
        }
        const allProducts = await response.json();
console.log("Check this in F12 Console:", allProducts); // <--- Add this
        
        
        // FILTER: Only show products marked as best sellers. 
        // If your database doesn't have any best sellers yet, we show all products as a fallback.
        let products = allProducts.filter(p => p.is_best_seller == 1 || p.is_best_seller == "1");
        
        if (products.length === 0) {
            console.warn("No 'Best Sellers' found in DB, showing all products instead.");
            products = allProducts.slice(0, 12); // Show first 12 as fallback
        }

        // Remove any static markup or loading messages
        container.innerHTML = '';

        const frameClasses = [
            'frame-7', 'frame-10', 'frame-12', 'frame-14', 'frame-16', 'frame-18',
            'frame-9', 'frame-11', 'frame-13', 'frame-15', 'frame-17', 'frame-19'
        ];

       products.forEach((prod, index) => {
    const sizeHtml = prod.size ? `<div class="text-wrapper-11">${prod.size}</div>` : '';
    const frameClass = frameClasses[index % frameClasses.length];
    
    const article = document.createElement('article');
    article.className = frameClass;
    article.style.cursor = 'pointer';
    
    // 1. APPLY RADIUS TO CONTAINER
    article.style.borderRadius = '15px';
    article.style.overflow = 'hidden'; 
    article.style.display = 'flex';           // Ensures content stays aligned
    article.style.flexDirection = 'column';    // Keeps text below the image
    
    article.innerHTML = `
        <img class="rectangle-4" 
             src="${prod.image_url || '2-2-ZAM-CITY-1.jpg'}" 
             alt="${prod.name}" 
             style="border-radius: 15px 15px 0 0; width: 100%; object-fit: cover;" />
        <div class="frame-8" style="padding: 15px;"> <h3 class="text-wrapper-9">${prod.name}</h3>
            <p class="text-wrapper-10">${prod.description || 'Handcrafted quality'}</p>
            ${sizeHtml}
            <div class="text-wrapper-12">Php ${parseFloat(prod.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
    `;
    
    article.addEventListener('click', () => {
        if (typeof fetchProductAndOpenOverlay === 'function') {
            fetchProductAndOpenOverlay(prod.id);
        }
    });
    
    container.appendChild(article);
});

        console.log("Successfully rendered products:", products.length);

    } catch (err) {
        console.error("Failed to fetch products:", err);
        container.innerHTML = `<p style="grid-column: span 6; text-align: center; color: red;">
            Unable to load products. (Error: ${err.message})
        </p>`;
    }
}

// Call loadBestSellers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadBestSellers();
});

document.addEventListener('DOMContentLoaded', () => {
    const authOverlay = document.getElementById('authOverlay');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const closeBtn = document.getElementById('closeAuth');

    // Function to open modal (Attach this to your login link in the right-side menu)
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

    closeBtn.onclick = () => authOverlay.style.display = 'none';

    // Switch between Sign In and Sign Up
    document.getElementById('toSignIn').onclick = () => openAuthModal('signin');
    document.querySelector('.back-link').onclick = () => openAuthModal('signup');
});

document.addEventListener('DOMContentLoaded', () => {
    // Select modal buttons
    const signInBtn = document.querySelector('#signInForm .continue-btn');
    const signUpBtn = document.querySelector('#signUpForm .continue-btn');
    console.log('signInBtn:', signInBtn, 'signUpBtn:', signUpBtn);

    // Handle Sign Up
    if (signUpBtn) {
        signUpBtn.addEventListener('click', async () => {
            console.log('Sign up button clicked');
            const fullname = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPass').value;
            const confirmPassword = document.getElementById('regPassConfirm').value;

            console.log('Fullname:', fullname, 'Email:', email);

            // Basic validation
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

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }

            // Disable button and show loading
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
                    openAuthModal('signin'); // Switch to login after success
                } else {
                    alert(data.error || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Signup error:', error);
            } finally {
                // Re-enable button
                signUpBtn.disabled = false;
                signUpBtn.textContent = 'Continue';
            }
        });
    }

    // Handle Sign In (Updated handler below)
});

document.addEventListener('DOMContentLoaded', () => {
    const userProfile = document.getElementById('userProfile');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const navBarLinks = document.querySelector('.navbar');

    // Function to update the UI based on auth state
    function updateAuthUI() {
    const userName = localStorage.getItem('zambosur_user_name');
    const userProfileDiv = document.getElementById('userProfile');
    const nameDisplay = document.getElementById('userNameDisplay');

    if (userName) {
        // Show the profile div and set the name
        userProfileDiv.classList.remove('user-profile-hidden');
        nameDisplay.textContent = `Hello, ${userName}`;
    } else {
        // Hide it if not logged in
        userProfileDiv.classList.add('user-profile-hidden');
    }
}

    // Handle Sign In
const signInBtn = document.querySelector('#signInForm .continue-btn');
console.log('signInBtn found:', signInBtn);

if (signInBtn) {
    signInBtn.addEventListener('click', async () => {
        console.log('Sign in button clicked');
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
        credentials: 'include'
    });

    // Parse the JSON regardless of response status
    const data = await response.json();

    if (response.ok && data.user) { 
    alert('Login successful! Welcome ' + data.user.name);
    
    // Save to localStorage so the UI updates
    localStorage.setItem('zambosur_user_name', data.user.name);
    localStorage.setItem('zambosur_user_id', data.user.id);
    
    // Close modal and refresh or update UI
    authOverlay.style.display = 'none';
    updateAuthUI(); 
    window.location.reload(); 
    } else {
        // This is what was triggering before because data.success was missing
        alert(data.error || 'Login failed. Please check your credentials.');
    }
    } catch (error) {
        // This ONLY runs if the server is down or PHP crashed (Syntax Error)
        console.error('Signup error:', error);
        alert('Server Error: Check the F12 Network tab response.');
    } finally {
                signInBtn.disabled = false;
                signInBtn.textContent = 'Continue';
            }
        });
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
                    // Clear all user data from localStorage
                    localStorage.removeItem('zambosur_user_name');
                    localStorage.removeItem('zambosur_user_id');
                    localStorage.removeItem('zambosur_user_email');
                    updateAuthUI();
                    location.reload(); // Refresh to reset all states
                    break;
            }
        });
    });
    // Handle login click
    userProfile.addEventListener('click', () => {
        console.log('User profile clicked, login-mode:', userProfile.classList.contains('login-mode'));
        if (userProfile.classList.contains('login-mode')) {
            openAuthModal('signin');
        }
    });
    // Check auth status on page load
    updateAuthUI();
});

document.addEventListener('DOMContentLoaded', () => {
    // --- Product Filtering Logic ---
    const categoryLinks = document.querySelectorAll('#categoryList li');
    const products = document.querySelectorAll('.product-card');
    const categoryTitle = document.getElementById('currentCategoryTitle');

    if (categoryLinks.length > 0 && products.length > 0) {
        categoryLinks.forEach(link => {
            link.addEventListener('click', () => {
                // 1. Update Active State in Sidebar
                categoryLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');

                // 2. Get Selected Category
                const selectedCategory = link.getAttribute('data-category');
                
                // 3. Update the Page Title
                categoryTitle.textContent = link.textContent;

                // 4. Filter Products
                products.forEach(product => {
                    const productCategory = product.getAttribute('data-category');
                    
                    if (selectedCategory === 'all' || productCategory === selectedCategory) {
                        product.style.display = 'block'; // Show
                        product.style.animation = 'fadeIn 0.5s ease'; // Optional animation
                    } else {
                        product.style.display = 'none'; // Hide
                    }
                });
            });
        });
    }
});

// --- Product Detail Overlay Functions ---
// Make product cards clickable on landing page
document.addEventListener('DOMContentLoaded', () => {
    // Select all product card clickable elements on the landing page
    const productCards = document.querySelectorAll('.img-wrapper, .frame-3, .frame-4, .frame-5, .frame-6');
    
    // Map product card indices to product IDs from database
    // These correspond to the first 6 products in your database
    const productIds = [1, 2, 3, 4, 5, 6]; // Adjust based on your actual product IDs
    
    productCards.forEach((card, index) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const productId = productIds[index] || 1;
            // Fetch product data from database and open overlay
            fetchProductAndOpenOverlay(productId);
        });
    });
});

// Fetch product from API and open overlay
async function fetchProductAndOpenOverlay(productId) {
    try {
        // Use the path we know works
        const response = await fetch('https://zambosur-api-v2.onrender.com/products');
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const products = await response.json();
        
        // Find the specific product that matches the ID we clicked
        const product = products.find(p => p.id == productId || p.id == String(productId));
        
        if (product) {
            console.log("Found product:", product.name);
            openProductOverlay(product);
        } else {
            console.error("Product ID not found in database:", productId);
        }
        
    } catch (err) {
        console.error("Failed to fetch product from DB:", err);
        // If the database fails, you can keep your static fallback, 
        // but it will never be perfectly accurate to what the user clicked.
    }
}

/*function openProductOverlay(product) {
    // 1. MATCH THE HTML IDs: 'productDetailOverlay' NOT 'productOverlay'
    const overlay = document.getElementById('productDetailOverlay');
    const title = document.getElementById('overlayProductName'); // Match your HTML ID
    const desc = document.getElementById('overlayProductDesc');
    const priceEl = document.getElementById('overlayProductPrice');
    const totalPriceEl = document.getElementById('totalPrice');
    const mainImage = document.getElementById('overlayMainImage');
    const quantityValue = document.getElementById('quantityValue');
    
    if (overlay) {
        // Reset quantity to 1 when opening
        if (quantityValue) quantityValue.textContent = '1';

        // Check if using Database fields
        if (product.name) {
            if (title) title.textContent = product.name;
            if (desc) desc.textContent = product.description || 'No description available.';
            
            // Update Image
            if (mainImage) {
                mainImage.src = product.image_url || '2-2-ZAM-CITY-1.jpg';
            }
            
            // Update Prices
            const price = parseFloat(product.price);
            const formattedPrice = `Php ${price.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
            
            if (priceEl) priceEl.textContent = formattedPrice;
            if (totalPriceEl) totalPriceEl.textContent = formattedPrice;

        } else {
            // Fallback for your static array
            if (title) title.textContent = product.title;
            if (desc) desc.textContent = product.desc;
            if (priceEl) priceEl.textContent = product.price;
            if (totalPriceEl) totalPriceEl.textContent = product.price;
        }
        
        // Show the overlay
        overlay.style.display = 'flex'; // Your CSS uses flex for the overlay
        document.body.style.overflow = 'hidden'; 
        
        // Load related products based on the new current product
        if (typeof loadRelatedProducts === 'function') {
            loadRelatedProducts(product);
        }
    } else {
        console.error("Could not find element with ID 'productDetailOverlay'");
    }
}*/

/*function closeProductOverlay() {
    const overlay = document.getElementById('productOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}*/
/* Fetch product from API and open overlay
async function fetchProductAndOpenOverlay(productId) {
    try {
        const response = await fetch(`backend/index.php/api/products/${productId}`);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const product = await response.json();
        
        // Store current product for cart operations
        currentProduct = product;
        currentQuantity = 1;
        
        // Open overlay with fetched product data
        openProductOverlay(product);
        
    } catch (err) {
        console.error("Failed to fetch product:", err);
        // Fallback to static data if API fails
        const staticProducts = [
            { name: 'Malongs', description: 'The Kumala Banig Weavers of Kumalarang | Zamboanga del Sur\n\nMasterful banig (mat) weaving using seagrass and natural dyes (turmeric, annatto).', price: '150.00', image_url: '2-2-ZAM-CITY-1.jpg' },
            { name: 'Pillowcase', description: 'Handcrafted pillowcases with traditional patterns', price: '250.00', image_url: '2-2-ZAM-CITY-1.jpg' },
            { name: 'Baskets', description: 'Woven baskets from local artisans', price: '180.00', image_url: '2-2-ZAM-CITY-1.jpg' },
            { name: 'Weaving', description: 'Traditional weaving from Zamboanga del Sur', price: '350.00', image_url: '2-2-ZAM-CITY-1.jpg' },
            { name: 'Miniatures', description: 'Hand-carved wooden miniatures', price: '450.00', image_url: '2-2-ZAM-CITY-1.jpg' },
            { name: 'View All', description: 'Browse our complete collection', price: '100.00', image_url: '2-2-ZAM-CITY-1.jpg' }
        ];
        const staticProduct = staticProducts[productId - 1] || staticProducts[0];
        currentProduct = staticProduct;
        currentQuantity = 1;
        openProductOverlay(staticProduct);
    }
}*/
// Close overlay when clicking outside content
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('productOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeProductOverlay();
            }
        });
    }
    
    // Close overlay with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProductOverlay();
        }
    });
});

// ============================================
// PRODUCT DETAIL OVERLAY FUNCTIONS
// ============================================

// Global variables for current product
let currentProduct = null;
let currentQuantity = 1;


function openProductOverlay(product) {

    currentProduct = product;
    
    const overlay = document.getElementById('productOverlay');
    const title = document.getElementById('overlayProductTitle');
    const desc = document.getElementById('overlayProductDesc');
    const mainImage = document.getElementById('overlayMainImage');
    const priceEl = document.getElementById('overlayProductPrice');
    const totalPriceEl = document.getElementById('totalPrice');
    const quantityValue = document.getElementById('quantityValue');
    const sizeEl = document.querySelector('.product-size');
    
    if (overlay) {
        // Reset quantity to 1
        currentQuantity = 1;
        quantityValue.textContent = '1';
        
        // Check if product has database fields or is static data
        if (product.name) {
            // Database product data
            title.textContent = product.name;
            desc.textContent = product.description || '';
            
            // Update main image
            if (mainImage) {
                mainImage.src = product.image_url || '2-2-ZAM-CITY-1.jpg';
            }
            
            // Update price
            const price = parseFloat(product.price).toFixed(2);
            if (priceEl) priceEl.textContent = `Php ${price}`;
            if (totalPriceEl) totalPriceEl.textContent = `Php ${price}`;
            
            // Update size if available
            if (sizeEl && product.size) {
                sizeEl.textContent = `Size: ${product.size}`;
            } else if (sizeEl) {
                sizeEl.textContent = 'Size: Standard';
            }
        } else {
            // Static fallback data
            title.textContent = product.title || product.name;
            desc.textContent = product.desc || product.description;
            
            if (mainImage) {
                mainImage.src = product.image_url || '2-2-ZAM-CITY-1.jpg';
            }
            
            const price = parseFloat(product.price).toFixed(2);
            if (priceEl) priceEl.textContent = `Php ${price}`;
            if (totalPriceEl) totalPriceEl.textContent = `Php ${price}`;
            
            if (sizeEl) sizeEl.textContent = 'Size: ' + (product.size || 'Standard');
        }
        
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Load related products
        loadRelatedProducts(product.category_id || 1);
    }
}

function closeProductOverlay() {
    const overlay = document.getElementById('productOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Update quantity
function updateQuantity(change) {
    const quantityValue = document.getElementById('quantityValue');
    const totalPriceEl = document.getElementById('totalPrice');
    const priceEl = document.getElementById('overlayProductPrice');
    
    if (quantityValue && totalPriceEl && priceEl) {
        let newQuantity = currentQuantity + change;
        
        // Prevent quantity from going below 1
        if (newQuantity < 1) {
            newQuantity = 1;
        }
        
        // Maximum quantity limit
        if (newQuantity > 99) {
            newQuantity = 99;
        }
        
        currentQuantity = newQuantity;
        quantityValue.textContent = currentQuantity;
        
        // Calculate and update total price
        const priceText = priceEl.textContent.replace('Php ', '');
        const unitPrice = parseFloat(priceText);
        const total = (unitPrice * currentQuantity).toFixed(2);
        totalPriceEl.textContent = `Php ${total}`;
    }
}

async function syncWithDatabase(action, data) {
    
    // Map your actions to your new clean URL structure
    const endpoint = action === 'cart' ? '/user/cart/add' : `/user/${action}/add`;

    try {
        const response = await fetch(`https://zambosur-api-v2.onrender.com${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            // CRITICAL: This allows the backend to see your PHP Session
            credentials: 'include' 
        });

        const result = await response.json();
        
        if (result.error === "Please login to continue") {
            // If the session expired on the server, clear local storage and ask for login
            localStorage.removeItem('zambosur_user_id');
            alert("Your session has expired. Please log in again.");
            openAuthModal('signin');
            return false;
        }

        return result.success;
    } catch (err) {
        console.error("Sync error:", err);
        return false;
    }
}

// --- 1. Add to Cart (Database Version) ---
async function addToCart() {
    // 1. Check if user is logged in
    const userId = localStorage.getItem('zambosur_user_id');
    
    if (!userId) {
        alert("Please log in first to add items to your cart.");
        // Open your existing auth modal automatically
        if (typeof openAuthModal === 'function') {
            closeProductOverlay(); // Close product details to focus on login
            openAuthModal('signin');
        }
        return;
    }

    // 2. Existing product check
    if (!currentProduct) {
        alert("Please select a product");
        return;
    }

    // 3. Prepare ID
    const p_id = currentProduct.id || currentProduct.product_id;

    // 4. Database Sync
    const success = await syncWithDatabase('cart', {
        product_id: p_id,
        quantity: currentQuantity,
        user_id: userId // It's good practice to send the ID back to the server
    });

    if (success) {
        alert(`${currentProduct.name} added to cart!`);
        closeProductOverlay();
    }
}

// --- 2. Save for Later (Database Version) ---
async function saveProduct() {
    // ✅ 1. Check if user is logged in
    const userId = localStorage.getItem('zambosur_user_id');
    
    if (!userId) {
        alert("Please log in first to save items for later.");
        if (typeof openAuthModal === 'function') {
            closeProductOverlay();
            openAuthModal('signin');
        }
        return;
    }

    if (!currentProduct) return alert('No product selected');

    const success = await syncWithDatabase('save', {
        product_id: currentProduct.id
    });

    if (success) {
        alert(`${currentProduct.name} is now in your "Saved for Later" list!`);
    }
}

// --- 3. Wishlist (Database Version) ---
async function toggleWishlist(element) {
    // ✅ 1. Check if user is logged in
    const userId = localStorage.getItem('zambosur_user_id');
    
    if (!userId) {
        alert("Please log in first to save items to your wishlist.");
        // Automatically open the sign-in modal
        if (typeof openAuthModal === 'function') {
            closeProductOverlay();
            openAuthModal('signin');
        }
        return; // Stop execution
    }

    // 2. Check if product data exists
    if (!currentProduct) {
        alert("Product data not loaded yet.");
        return;
    }

    // 3. Sync with database
    const success = await syncWithDatabase('wishlist', {
        product_id: currentProduct.id,
        user_id: userId // Passing user_id is good practice
    });

    if (success) {
        // Update UI state
        if (element) {
            element.style.color = 'red'; 
            element.classList.add('active');
        }
        alert(`${currentProduct.name} added to wishlist!`);
    }
}


// Load related products
async function loadRelatedProducts(categoryId) {
    const relatedGrid = document.getElementById('relatedProductsGrid');
    
    if (!relatedGrid) return;
    
    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/products');
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        
        // Filter out current product and get up to 4 related products
        const relatedProducts = products
            .filter(p => p.id !== (currentProduct?.id))
            .slice(0, 4);
        
        // Clear existing content
        relatedGrid.innerHTML = '';
        
        // Add related product items
        relatedProducts.forEach(product => {
            const item = document.createElement('div');
            item.className = 'related-product-item';
            item.innerHTML = `
                <img src="${product.image_url || '2-2-ZAM-CITY-1.jpg'}" alt="${product.name}" />
                <p class="related-product-name">${product.name}</p>
                <p class="related-product-price">Php ${parseFloat(product.price).toFixed(2)}</p>
            `;
            item.addEventListener('click', () => {
                fetchProductAndOpenOverlay(product.id);
            });
            relatedGrid.appendChild(item);
        });
        
    } catch (err) {
        console.error('Failed to load related products:', err);
        relatedGrid.innerHTML = '<p>No related products found</p>';
    }
}

// Add this to the very end of your JS file
window.openProductOverlay = openProductOverlay;
window.addToCart = addToCart;
window.saveProduct = saveProduct;
window.toggleWishlist = toggleWishlist;
window.updateQuantity = updateQuantity;

async function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    if (!badge) return;

    let totalItems = 0;
    const userId = localStorage.getItem('zambosur_user_id');

    if (userId) {
        // CASE A: Logged In - Fetch count from Database
        try {
            const res = await fetch('https://zambosur-api-v2.onrender.com/user/cart/count');
            const data = await res.json();
            if (data.success) {
                totalItems = data.count;
            }
        } catch (err) {
            console.error("Error fetching cart count:", err);
        }
    } else {
        // CASE B: Guest - Calculate from LocalStorage
        const localCart = JSON.parse(localStorage.getItem('zambosur_cart') || '[]');
        totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Update the UI
    badge.innerText = totalItems;
    
    // Optional: Hide badge if cart is empty
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

async function checkAuthAndRedirect(event, targetUrl) {
    event.preventDefault(); // Stop the link from opening immediately
    
    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/auth/profile');
        const result = await response.json();

        if (result.success) {
            // User is logged in, let them through
            window.location.href = targetUrl;
        } else {
            // Not logged in, send to login
            alert("You need to sign in to access this feature.");
             openAuthModal('signin');
        }
    } catch (error) {
        console.error("Auth check failed:", error);
    }
}


function toggleChat() {
    const chat = document.getElementById('chat-window');
    const isOpening = chat.style.display === 'none';
    
    chat.style.display = isOpening ? 'flex' : 'none';

    // If opening, ensure the support buttons are visible
    if (isOpening) {
        addSupportButtons();
    }
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    // 1. Display User Message
    addMessageToBody(message, 'user-message');
    input.value = '';

    // 2. Show a "Typing..." indicator
    const typingId = 'typing-' + Date.now();
    addMessageToBody("Writing...", 'bot-message', typingId);

    try {
        // 3. Send to your PHP backend
        const response = await fetch(`https://zambosur-api-v2.onrender.com/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // CRITICAL: Tell PHP to expect JSON
            },
            body: JSON.stringify({ message: message }) // Use the dynamic variable here!
        });

        // Check if the server actually returned a 200 OK
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        const data = await response.json();
        
        // 4. Replace "Typing..." with AI Response
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.textContent = data.reply;
        }
    } catch (error) {
        console.error("Chat Error:", error);
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            // Check if the error message contains the word "quota" or "limit"
            if (error.message.toLowerCase().includes('quota') || error.message.toLowerCase().includes('limit')) {
                typingElement.textContent = "I'm a bit busy right now. Please wait about 30 seconds and try again!";
            } else {
                typingElement.textContent = "Oops! I'm having trouble connecting to ZamboSur AI. Please check your internet.";
            }
        }
    }
}

function addMessageToBody(text, className, id = null) {
    const body = document.getElementById('chat-body');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    if (id) msgDiv.id = id;
    msgDiv.textContent = text;
    body.appendChild(msgDiv);
    body.scrollTop = body.scrollHeight; // Auto-scroll to bottom
}

function addSupportButtons() {
    const chatBody = document.getElementById('chat-body');
    
    // Create a container to keep buttons organized
    const btnContainer = document.createElement('div');
    btnContainer.id = "support-btn-container";
    btnContainer.style = "display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; padding: 5px;";

    // Define your topics
    const topics = [
        { label: "📍 Location", type: "chat" },
        { label: "📦 Shipping", type: "chat" },
        { label: "📞 Contact Support", type: "call" } // Special type for calling
    ];

    topics.forEach(topic => {
        const btn = document.createElement('button');
        btn.innerHTML = topic.label;
        btn.style = "background: #8b4513; color: white; border: none; padding: 8px 15px; border-radius: 20px; font-size: 12px; cursor: pointer; font-family: 'Poppins', sans-serif; transition: 0.3s;";
        
        btn.onclick = () => {
            if (topic.type === "call") {
                // This triggers the phone dialer
                window.location.href = "tel:09955138368";
            } else {
                // This sends the text to your PHP/AI
                document.getElementById('chat-input').value = topic.label;
                sendMessage();
            }
        };

        // Hover effect
        btn.onmouseover = () => btn.style.background = "#5d3415";
        btn.onmouseout = () => btn.style.background = "#8b4513";

        btnContainer.appendChild(btn);
    });

    chatBody.appendChild(btnContainer);
}

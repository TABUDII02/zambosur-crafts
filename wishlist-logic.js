document.addEventListener('DOMContentLoaded', () => {
    loadWishlistItems();
});

async function loadWishlistItems() {
    const container = document.getElementById('wishlistContainer');
    const countBadge = document.getElementById('wishlistCount');

    if (!container) return;

    try {
        // ✅ ADDED: credentials: 'include' to ensure session cookies are sent
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/wishlist/all', {
            method: 'GET',
            credentials: 'include' 
        });
        
        const data = await response.json();

        if (data.success && data.items) {
            const items = data.items;
            
            if (countBadge) {
                countBadge.textContent = `${items.length} Items`;
            }

            if (items.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heart-broken"></i>
                        <p>Your wishlist is empty. Start exploring our crafts!</p>
                        <a href="allproducts-dashboard.html" class="browse-btn">Browse Products</a>
                    </div>`;
                return;
            }

            container.innerHTML = items.map(product => `
                <div class="product-card">
                    <div class="product-badge ${product.source}">
                        ${product.source === 'wishlist' ? '<i class="fas fa-heart"></i> Hearted' : '<i class="fas fa-bookmark"></i> Saved'}
                    </div>
                    <img src="${product.image_url}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">Php ${parseFloat(product.price).toFixed(2)}</p>
                        <div class="wishlist-actions">
                            <button onclick="moveToCart(${product.id})" class="add-btn">Add to Cart</button>
                            <button onclick="removeFromWishlist(${product.id}, '${product.source}')" class="remove-btn" title="Remove">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="error-text">${data.error || 'Please log in to view your wishlist.'}</p>`;
        }
    } catch (error) {
        console.error("Error loading wishlist:", error);
        container.innerHTML = '<p class="error-text">Unable to load wishlist. Please try again later.</p>';
    }
}

async function removeFromWishlist(id, source) {
    if (!confirm('Are you sure you want to remove this item?')) return;

    // Use 'wishlist' or 'save' endpoint based on the source badge
    const endpoint = source === 'wishlist' ? 'wishlist' : 'save';

    try {
        const response = await fetch(`https://zambosur-api-v2.onrender.com/user/${endpoint}/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: id }),
            credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
            loadWishlistItems(); // Refresh the list
        } else {
            alert(result.error || "Failed to remove item.");
        }
    } catch (error) {
        console.error("Removal error:", error);
    }
}

async function moveToCart(id, source = 'wishlist') {
    try {
        // 1. Add to Cart
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: id, quantity: 1 }),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            // 2. Automatically remove from wishlist/saved table
            // We await this so the UI doesn't refresh until the delete is done
            await removeFromWishlist(id, source); 
            
            alert("Item moved to your cart!");
            
            // 3. Refresh the wishlist display to show it's gone
            if (typeof loadWishlistItems === 'function') {
                loadWishlistItems();
            }
        } else {
            alert(result.error || "Could not move item to cart.");
        }
    } catch (error) {
        console.error("Move to cart error:", error);
        alert("An error occurred while moving the item.");
    }
}

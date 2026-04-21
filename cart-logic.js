document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});

async function loadCart() {
    const badge = document.getElementById('cartCount');
    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/cart/all', {
    credentials: 'include' 
});
        const result = await response.json();

        if (result.success && result.items) {
            // Update the badge count immediately
            const count = result.items.length;
            if (badge) badge.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;

            renderCartItems(result.items);
            calculateTotals(result.items);
        } else {
            if (badge) badge.textContent = "0 Items";
        }
    } catch (err) {
        console.error("Cart Error:", err);
    }
}

function updateCartBadge(count) {
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
}

function renderCartItems(items = []) {
    const container = document.getElementById('cartItemsList');
    
    if (items.length === 0) {
        container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
        updateCartBadge(0);
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="cart-item">
            <div class="item-img">
                <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.product_name}">
            </div>
            <div class="item-info">
                <h4>${item.product_name}</h4>
                <p class="price">₱${parseFloat(item.price).toLocaleString()}</p>
                <button class="remove-btn" onclick="removeItem(${item.product_id})">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="quantity-controls">
                <button onclick="changeQty(${item.product_id}, -1)">-</button>
                <span class="qty-val">${item.quantity}</span>
                <button onclick="changeQty(${item.product_id}, 1)">+</button>
            </div>
        </div>
    `).join('');
}

document.getElementById('checkoutBtn').addEventListener('click', () => {
    // Check if user is logged in (using your existing logic)
    if (!localStorage.getItem('zambosur_user_id')) {
        alert("Please login to proceed with your order.");
        return;
    }

    // Direct to a checkout page (you will create this next)
    window.location.href = 'checkout.html';
});

async function calculateTotals(items) {
    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    
    // Default Shipping
    let shippingFee = 150; 

    try {
        const addrRes = await fetch('https://zambosur-api-v2.onrender.com/user/addresses/all', {
    credentials: 'include'
});
        const addrData = await addrRes.json();
        const defaultAddr = addrData.addresses.find(a => parseInt(a.is_default) === 1);
        
        if (defaultAddr) {
            const city = defaultAddr.city.toLowerCase();
            // Local Pagadian rate
            if (city.includes("pagadian")) shippingFee = 50;
        }
    } catch (e) { /* fallback to 150 */ }

    const total = subtotal + shippingFee;

    // Update UI
    document.getElementById('subtotalPrice').textContent = `₱${subtotal.toLocaleString()}`;
    const shipEl = document.getElementById('shippingFeePrice');
    if (shipEl) shipEl.textContent = `₱${shippingFee.toLocaleString()}`;
    document.getElementById('totalOrderPrice').textContent = `₱${total.toLocaleString()}`;

    // --- ENABLE CHECKOUT BUTTON ---
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (items.length > 0) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = "1";
        checkoutBtn.style.cursor = "pointer";
    } else {
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = "0.5";
    }
}

// Add 'window.' to make them globally accessible to your onclick attributes
window.changeQty = async function(productId, change) {
    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/cart/update-qty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, change: change }),
            credentials: 'include'
        });
        const result = await response.json();
        if (result.success) {
            await loadCart(); // Refresh the cart list and totals
        }
    } catch (err) {
        console.error("Update failed:", err);
    }
};

window.removeItem = async function(productId) {
    if(!confirm("Remove this item from your cart?")) return;
    
    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId }),
            credentials: 'include'
        });
        const result = await response.json();
        if (result.success) {
            await loadCart();
        }
    } catch (err) {
        console.error("Remove failed:", err);
    }
};

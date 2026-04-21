// Global variables to track totals
let currentSubtotal = 0;
let currentShipping = 50;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Data Load
    await loadCheckoutDetails();
    
    // 2. Shipping/Pickup Toggle Logic
    initShippingToggle();

    // 3. Discount Logic - Added safety check
    const discountBtn = document.querySelector('.apply-btn');
    if(discountBtn) {
        discountBtn.addEventListener('click', handleDiscount);
    }
    
    // 4. Place Order Submission
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if(placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }
});

async function loadCheckoutDetails() {
    try {
        const profileRes = await fetch('https://zambosur-api-v2.onrender.com/auth/profile', {
            credentials: 'include' 
        });
        const user = await profileRes.json();
        
        if(user.success) {
            if(document.getElementById('displayCustomerName')) document.getElementById('displayCustomerName').value = user.data.name || "";
            if(document.getElementById('displayEmail')) document.getElementById('displayEmail').value = user.data.email || "";
            if(document.getElementById('displayPhone')) document.getElementById('displayPhone').value = user.data.phone || "";
            
            // Fix: Your HTML used 'displayAddress' in JS but your HTML inputs might be separate (City/State)
            // Ensure this ID matches an input in your HTML
            const addrField = document.getElementById('displayAddress');
            if(addrField) addrField.value = user.data.address || "";
            
            if (user.data.address && !user.data.address.toLowerCase().includes("pagadian")) {
                currentShipping = 150;
            }
        }
    } catch(e) { console.error("Profile load failed", e); }

    try {
        const cartResponse = await fetch('https://zambosur-api-v2.onrender.com/user/cart/all', {
            credentials: 'include'
        });
        const cart = await cartResponse.json();
        
        if(cart.success && cart.items.length > 0) {
            currentSubtotal = cart.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
            renderSummaryItems(cart.items);
            updatePriceDisplay();
        } else {
            window.location.href = 'cart.html';
        }
    } catch(e) { console.error("Cart load failed", e); }
}

function initShippingToggle() {
    const options = document.querySelectorAll('.toggle-option');
    const paymentSection = document.getElementById('paymentSection');
    const payBtn = document.getElementById('placeOrderBtn');

    if (!options.length || !payBtn) return;

    options.forEach(option => {
        option.addEventListener('click', function() {
            options.forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            
            const isPickUp = this.innerText.includes('Pick up');
            
            if (isPickUp) {
                currentShipping = 0;
                if(paymentSection) paymentSection.style.display = "none";
                payBtn.textContent = "Confirm Pickup Order";
            } else {
                // Get address safely
                const addrField = document.getElementById('displayAddress');
                const addr = addrField ? addrField.value.toLowerCase() : "";
                currentShipping = addr.includes('pagadian') ? 50 : 150;
                
                if(paymentSection) paymentSection.style.display = "block";
                updateButtonText();
            }
            updatePriceDisplay();
        });
    });
}

// Global listener for radio buttons
document.addEventListener('change', (e) => {
    if (e.target.name === 'payment_method') {
        const onlineOptions = document.getElementById('onlineOptions');
        if (e.target.value === 'PayNow') {
            onlineOptions.style.display = 'block';
        } else {
            onlineOptions.style.display = 'none';
        }
        updateButtonText();
    }
});
function updateButtonText() {
    const method = document.querySelector('input[name="payment_method"]:checked')?.value;
    const payBtn = document.getElementById('placeOrderBtn');
    if(!payBtn) return;

    const isPickup = document.querySelector('.toggle-option.active')?.innerText.includes('Pick up');
    if(isPickup) {
        payBtn.textContent = "Confirm Pickup Order";
    } else {
        payBtn.textContent = (method === 'PayNow') ? "Pay Now" : "Place COD Order";
    }
}

function updatePriceDisplay() {
    const total = currentSubtotal + currentShipping;
    
    if(document.getElementById('checkoutSubtotal')) document.getElementById('checkoutSubtotal').textContent = `₱${currentSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if(document.getElementById('deliveryFee')) document.getElementById('deliveryFee').textContent = `₱${currentShipping.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if(document.getElementById('checkoutTotal')) document.getElementById('checkoutTotal').textContent = `₱${total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

function renderSummaryItems(items) {
    const container = document.getElementById('checkoutItemsList');
    if (!container) return;

    container.innerHTML = items.map(item => {
        const imagePath = item.image_url ? `https://zambosur-api-v2.onrender.com/assets/products/${item.image_url}` : 'placeholder.jpg';
        return `
            <div class="mini-cart-item">
                <img src="${imagePath}" alt="${item.product_name}" onerror="this.src='placeholder.jpg'">
                <div class="item-meta">
                    <p><strong>${item.product_name}</strong></p>
                    <p class="text-muted">Qty: ${item.quantity}</p>
                    <p class="price">₱${parseFloat(item.price).toLocaleString()}</p>
                </div>
            </div>
        `;
    }).join('');
}

async function handleDiscount() {
    const code = document.querySelector('.discount-box input').value;
    if(code.toUpperCase() === "ZAMBOSUR10") {
        alert("Discount Applied: 10% off!");
        // You can add logic here to subtract from currentSubtotal
    } else {
        alert("Invalid Discount Code");
    }
}

async function handlePlaceOrder() {
    console.log("Place Order Clicked"); // DEBUG LOG
    const btn = document.getElementById('placeOrderBtn');
    
    // 1. Validate Inputs
    const phoneField = document.getElementById('displayPhone');
    const addrField = document.getElementById('displayAddress') || document.getElementById('displayCity'); // Check both
    
    const phone = phoneField ? phoneField.value : "";
    const address = addrField ? addrField.value : "";
    
    if(!phone || phone.includes('X')) {
        alert("Please provide a valid phone number.");
        return;
    }
    
    if(!address || address.trim() === "") {
        alert("Please provide a shipping address.");
        return;
    }

    const activeToggle = document.querySelector('.toggle-option.active');
    const isPickup = activeToggle ? activeToggle.innerText.includes('Pick up') : false;
    
    // Inside handlePlaceOrder, change how selectedPayment is calculated:
        let selectedPayment = 'Store Pickup';
        if (!isPickup) {
            const mainMethod = document.querySelector('input[name="payment_method"]:checked').value;
            if (mainMethod === 'PayNow') {
                const provider = document.querySelector('input[name="online_provider"]:checked').value;
                selectedPayment = `Online (${provider})`; // e.g., "Online (GCash)"
            } else {
                selectedPayment = 'COD';
            }
        }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    // Inside handlePlaceOrder...
    const orderData = {
        total_amount: currentSubtotal + currentShipping, // Matches PHP $data['total_amount']
        address: address,                               // Matches PHP $data['address']
        contact: phone,                                 // Matches PHP $data['contact']
        payment_method: selectedPayment,               // Matches PHP $data['payment_method']
        shipping_type: isPickup ? 'Pickup' : 'Delivery' // Matches PHP $data['shipping_type']
    };

    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/order/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData),
            credentials: 'include'
        });

        const result = await response.json();
        if(result.success) {
            window.location.href = 'order-success.html?id=' + result.order_id;
        } else {
            alert("Order Failed: " + result.error);
            resetButton(btn, selectedPayment);
        }
    } catch(err) {
        console.error("Order creation failed:", err);
        resetButton(btn, selectedPayment);
    }
}

function resetButton(btn, method) {
    btn.disabled = false;
    btn.textContent = (method === 'PayNow') ? "Pay Now" : "Place Order";
}

let savedProfileAddress = ""; // Store this globally

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(); // Fetch name, phone, and address on load
});

async function loadUserProfile() {
    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/profile', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            // Fill existing fields
            document.getElementById('displayCustomerName').value = data.user.fullname;
            document.getElementById('displayEmail').value = data.user.email;
            document.getElementById('displayPhone').value = data.user.phone;
            
            // Store and set default address
            savedProfileAddress = data.user.address;
            document.getElementById('displayAddress').value = savedProfileAddress;
            document.getElementById('displayAddress').readOnly = true; // Lock it by default
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

function toggleAddressField() {
    const addressInput = document.getElementById('displayAddress');
    const isNew = document.querySelector('input[name="address_type"]:checked').value === 'new';

    if (isNew) {
        addressInput.value = ""; // Clear for new entry
        addressInput.readOnly = false;
        addressInput.placeholder = "Please type the new shipping address...";
        addressInput.focus();
    } else {
        addressInput.value = savedProfileAddress; // Revert to saved
        addressInput.readOnly = true;
    }
}

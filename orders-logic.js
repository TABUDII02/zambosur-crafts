document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        fetchOrders(e.target.value);
    });
});

async function fetchOrders(filter = 'all') {
    const container = document.getElementById('ordersContainer');
    
    try {
        const response = await fetch(`backend/get_orders.php?status=${filter}`);
        const result = await response.json();

        if (result.success && result.orders.length > 0) {
            container.innerHTML = result.orders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <span class="order-id">Order ID: #${order.order_number}</span>
                            <p class="order-date">Placed on: ${new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                    
                    <div class="order-summary">
                        <p><strong>Total Items:</strong> ${order.item_count}</p>
                        <p><strong>Total Amount:</strong> ₱${parseFloat(order.total_price).toLocaleString()}</p>
                    </div>

                    <div class="order-footer">
                        <a href="order-details.html?id=${order.id}" class="view-details-btn">View Details</a>
                        ${order.status === 'Delivered' ? '<button class="review-btn">Write a Review</button>' : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="empty-orders">
                <i class="fas fa-shopping-bag"></i>
                <p>You haven't placed any orders yet.</p>
                <a href="allproducts-dashboard.html">Start Shopping</a>
            </div>`;
        }
    } catch (error) {
        container.innerHTML = `<p>Unable to load orders. Please try again later.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const ordersContainer = document.getElementById('ordersContainer');
    const statusFilter = document.getElementById('statusFilter');
    let allOrders = []; // Store orders globally to filter without re-fetching

    async function fetchOrders() {
        try {
            const response = await fetch('/zambosur_craft/backend/index.php/api/user/orders/all');
            const result = await response.json();

            if (result.success) {
                allOrders = result.orders;
                renderOrders(allOrders);
            } else {
                ordersContainer.innerHTML = `<p class="empty-msg">No orders found. Time to start your first craft journey!</p>`;
            }
        } catch (error) {
            ordersContainer.innerHTML = `<p class="error-msg">Failed to connect to the server.</p>`;
        }
    }

    function renderOrders(ordersToDisplay) {
    if (ordersToDisplay.length === 0) {
        ordersContainer.innerHTML = `<p class="empty-msg">No orders match this status.</p>`;
        return;
    }

    ordersContainer.innerHTML = ordersToDisplay.map(order => `
        <div class="order-card" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
            <div class="order-header" style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <div>
                    <span class="order-number" style="font-weight: bold;">Order #${order.order_id}</span>
                    <p class="order-date" style="font-size: 12px; color: #666;">Placed on ${order.date}</p>
                </div>
                <span class="status-badge ${order.status.toLowerCase()}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${order.status}
                </span>
            </div>
            <div class="order-body" style="padding: 10px 0;">
                ${order.items.map(item => `
                    <div class="order-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span class="item-name">
                            ${item.product_name} <small style="color: #888;">x${item.quantity}</small>
                        </span>
                        <span class="item-price" style="font-weight: 500;">
                            ₱${(parseFloat(item.price) * item.quantity).toLocaleString()}
                        </span>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer" style="display: flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 10px; margin-top: 5px;">
                <span class="total-label" style="font-weight: bold;">Total Amount</span>
                <span class="total-amount" style="font-weight: bold; color: #4f46e5; font-size: 18px;">
                    ₱${parseFloat(order.total).toLocaleString()}
                </span>
            </div>
        </div>
    `).join('');
}

    // Filter Logic
    statusFilter.addEventListener('change', (e) => {
        const selectedStatus = e.target.value;
        if (selectedStatus === 'all') {
            renderOrders(allOrders);
        } else {
            const filtered = allOrders.filter(o => o.status.toLowerCase() === selectedStatus);
            renderOrders(filtered);
        }
    });

    fetchOrders();
});
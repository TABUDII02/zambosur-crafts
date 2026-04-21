document.addEventListener('DOMContentLoaded', () => {
    loadAddresses();

    const modal = document.getElementById('addressModal');
    const addBtn = document.getElementById('addAddressBtn');
    const closeBtn = document.querySelector('.close-modal');

    addBtn.onclick = () => {
        document.getElementById('addressForm').reset();
        document.getElementById('modalTitle').textContent = "New Address";
        modal.style.display = "flex";
    };

    closeBtn.onclick = () => modal.style.display = "none";

document.getElementById('addressForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // MATCHING THE HTML IDs: addrLabel, addrFull, addrPhone, addrType, isDefault
    const formData = {
    label: document.getElementById('addrLabel').value,
    receiver: document.getElementById('addrReceiver').value,
    phone: document.getElementById('addrPhone').value,
    street: document.getElementById('addrStreet').value,
    barangay: document.getElementById('addrBarangay').value,
    city: document.getElementById('addrCity').value,
    province: document.getElementById('addrProvince').value,
    zip: document.getElementById('addrZip').value,
    address_type: document.getElementById('addrType').value,
    is_default: document.getElementById('isDefault').checked ? 1 : 0
};

    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/addresses/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            alert("Address saved!");
            document.getElementById('addressModal').style.display = "none";
            loadAddresses(); // Refresh the list
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        console.error("Save error:", err);
        alert("A server error occurred while saving.");
    }
});
});

async function loadAddresses() {
    const defaultContainer = document.getElementById('defaultAddressList');
    const shippingContainer = document.getElementById('shippingAddressList');
    const billingContainer = document.getElementById('billingAddressList');
    
    if (!defaultContainer || !shippingContainer || !billingContainer) return;

    try {
        const response = await fetch('https://zambosur-api-v2.onrender.com/user/addresses/all', {
            method: 'GET',
            credentials: 'include'
        });
        
        // 1. Get the raw text first to debug if there are still PHP notices
        const rawData = await response.text();
        
        try {
            // Try to parse the cleaned JSON
            const result = JSON.parse(rawData.substring(rawData.indexOf('{'))); 

            if (result.success) {
                defaultContainer.innerHTML = '';
                shippingContainer.innerHTML = '';
                billingContainer.innerHTML = '';

                result.addresses.forEach(addr => {
                    const cardHTML = createAddressCard(addr);

                    // Sort into Default section
                    if (parseInt(addr.is_default) === 1) {
                        defaultContainer.innerHTML += cardHTML;
                    }

                    // Sort into Specific Type sections (added .toLowerCase() for safety)
                    const type = addr.address_type.toLowerCase();
                    if (type === 'shipping') {
                        shippingContainer.innerHTML += cardHTML;
                    } else if (type === 'billing') {
                        billingContainer.innerHTML += cardHTML;
                    }
                });

                checkEmpty(shippingContainer, "No shipping addresses saved.");
                checkEmpty(billingContainer, "No billing addresses saved.");
                checkEmpty(defaultContainer, "No default address set.");
            }
        } catch (jsonErr) {
            console.error("JSON Parsing failed. Raw response:", rawData);
            defaultContainer.innerHTML = "<p>Error loading data. Check console.</p>";
        }
    } catch (err) {
        console.error("Network error:", err);
    }
}

function createAddressCard(addr) {
    return `
        <div class="address-card">
            <div class="card-header">
                <strong>${addr.label}</strong>
                ${addr.is_default ? '<span class="default-badge">Default</span>' : ''}
            </div>
            <div class="card-body">
                <p class="receiver-name">${addr.receiver_name}</p>
                <p class="address-text">
                    ${addr.street}, Brgy. ${addr.barangay}<br>
                    ${addr.city}, ${addr.province}, ${addr.zip_code}
                </p>
                <p class="phone-text"><i class="fas fa-phone"></i> ${addr.phone}</p>
            </div>
            <div class="card-actions">
                <button onclick="editAddress(${addr.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete" onclick="deleteAddress(${addr.id})"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `;
}

function checkEmpty(container, message) {
    if (container.innerHTML.trim() === '') {
        container.innerHTML = `<p class="empty-msg">${message}</p>`;
    }
}

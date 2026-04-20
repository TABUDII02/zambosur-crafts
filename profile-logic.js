/**
 * ZamboSur Crafts - Profile Logic with Update Capability
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchProfileData();

    // Attach logout event
    const logoutBtn = document.getElementById('logoutTrigger');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Attach edit/save event
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', toggleEditMode);
    }
});

let isEditMode = false;

async function fetchProfileData() {
    try {
        // 1. Fetch User Profile
      const response = await fetch('https://zambosur-api-v2.onrender.com/auth/profile', {
            credentials: 'include' // <--- REQUIRED
        });
        const result = await response.json();

        if (result.success) {
            updateProfileUI(result.data);

            // 2. Fetch Address Book to find the Default
           const addrResponse = await fetch('https://zambosur-api-v2.onrender.com/user/addresses/all', {
                credentials: 'include' // <--- REQUIRED
            });
            const addrResult = await addrResponse.json();

            if (addrResult.success && addrResult.addresses) {
                // Find the entry where is_default is 1
                const defaultAddr = addrResult.addresses.find(addr => addr.is_default == 1);
                
                const addressDisplay = document.getElementById('dbAddress');
                if (defaultAddr) {
                    // Match these keys to your PHP bind_param names: street, barangay, city
                    addressDisplay.textContent = `${defaultAddr.street}, ${defaultAddr.barangay}, ${defaultAddr.city}`;
                } else {
                    addressDisplay.innerHTML = '<span style="color: #888;">No default address set</span>';
                }
            }
        }
    } catch (error) {
        console.error("The request failed entirely:", error);
    }
}

function updateProfileUI(data) {
    const fullName = data.full_name || data.name || "Valued Customer";
    
    // Sidebar & Avatar
    if (document.getElementById('sideName')) document.getElementById('sideName').textContent = fullName;
    if (document.getElementById('sideEmail')) document.getElementById('sideEmail').textContent = data.email;
    if (document.getElementById('avatarIcon')) document.getElementById('avatarIcon').textContent = fullName.charAt(0).toUpperCase();

    // Main Content
    if (document.getElementById('dbName')) document.getElementById('dbName').textContent = fullName;
    if (document.getElementById('dbEmail')) document.getElementById('dbEmail').textContent = data.email;
    
    // Phone & Address (Show placeholders if empty)
    if (document.getElementById('dbPhone')) 
        document.getElementById('dbPhone').textContent = data.phone || "No phone number saved";
    
    if (document.getElementById('dbAddress')) 
        document.getElementById('dbAddress').textContent = data.address || "No address provided yet";

    // Date
    if (document.getElementById('dbJoined') && data.joined) {
        const joinedDate = new Date(data.joined);
        document.getElementById('dbJoined').textContent = !isNaN(joinedDate.getTime()) 
            ? joinedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : "Member since " + data.joined;
    }
}

// --- NEW EDIT/SAVE LOGIC ---

async function toggleEditMode() {
    const editBtn = document.getElementById('editBtn');
    const phoneEl = document.getElementById('dbPhone');
    const addressEl = document.getElementById('dbAddress');

    if (!isEditMode) {
        // Switch to Edit Mode: Turn text into inputs
        isEditMode = true;
        editBtn.textContent = "Save Changes";
        editBtn.style.background = "#27ae60"; // Change color to green for save

        phoneEl.innerHTML = `<input type="text" id="inputPhone" value="${phoneEl.textContent === 'No phone number saved' ? '' : phoneEl.textContent}">`;
        addressEl.innerHTML = `<textarea id="inputAddress">${addressEl.textContent === 'No address provided yet' ? '' : addressEl.textContent}</textarea>`;
    } else {
        // Save Mode: Collect data and send to PHP
        const newPhone = document.getElementById('inputPhone').value;
        const newAddress = document.getElementById('inputAddress').value;

        try {
            const response = await fetch('https://zambosur-api-v2.onrender.com/user/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: newPhone, address: newAddress }),
                credentials: 'include'
            });

            const result = await response.json();
            if (result.success) {
                alert("Profile updated successfully!");
                isEditMode = false;
                editBtn.textContent = "Edit Info";
                editBtn.style.background = ""; // Reset color
                fetchProfileData(); // Reload data to show static text again
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            console.error("Update failed:", error);
        }
    }
}

function handleLogout(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) {
        // Point to your actual Render API
        fetch('https://zambosur-api-v2.onrender.com/auth/logout', {
            method: 'POST', // Usually logout should be POST
            credentials: 'include'
        }).then(() => {
            localStorage.clear();
            window.location.href = 'index.html';
        }).catch(err => {
            console.error("Logout failed:", err);
            // Still clear local storage and redirect even if fetch fails
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
}

document.getElementById('passwordChangeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPwd = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmPassword').value;

    if (newPwd !== confirmPwd) {
        alert("New passwords do not match!");
        return;
    }

    try {
        // Point to your centralized index.php API
        const response = await fetch('/zambosur_craft/backend/index.php/api/user/security/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Fixed colon here
            body: JSON.stringify({
                current_password: currentPwd,
                new_password: newPwd
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("Password updated successfully!");
            e.target.reset();
        } else {
            alert(result.message || "Failed to update password.");
        }
    } catch (error) {
        console.error("Error updating password:", error);
        alert("A server error occurred. Please try again later.");
    }
});
document.getElementById('saveSettings').addEventListener('click', async () => {
    const settings = {
        email_notifications: document.getElementById('emailNotif').checked,
        sms_notifications: document.getElementById('smsNotif').checked,
        language: document.getElementById('langPref').value
    };

    try {
        const response = await fetch('backend/update_settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        const result = await response.json();
        if (result.success) {
            alert("Settings updated successfully!");
        }
    } catch (error) {
        console.error("Failed to save settings:", error);
    }
});
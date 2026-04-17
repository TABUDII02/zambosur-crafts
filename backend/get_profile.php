<?php
header('Content-Type: application/json');
session_start();

// Get database credentials from Render Environment Variables
$host = getenv('DB_HOST');     // Usually something like 'dpg-xxx-a.singapore-postgres.render.com'
$user = getenv('DB_USER');     // Your database username
$pass = getenv('DB_PASS');     // Your database password
$db   = getenv('DB_NAME');     // Your database name
$port = getenv('DB_PORT') ?: '3306'; // Default MySQL port

// If you are using MySQL on Render (via an external provider like Aiven or PlanetScale)
$conn = new mysqli($host, $user, $pass, $db, $port);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$user_id = $_SESSION['user_id'];

// SQL adjusted for your 'customers' table columns
$sql = "SELECT first_name, last_name, email, phone_number, address, created_at FROM customers WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        "success" => true,
        "data" => [
            "full_name" => $row['first_name'] . " " . $row['last_name'],
            "first_name" => $row['first_name'],
            "last_name" => $row['last_name'],
            "email" => $row['email'],
            "phone" => $row['phone_number'],
            "address" => $row['address'],
            "joined" => $row['created_at']
        ]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Customer record not found"]);
}

$stmt->close();
$conn->close();
?>

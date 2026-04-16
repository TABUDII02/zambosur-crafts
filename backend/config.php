<?php
/**
 * Database Configuration for ZamboSur Crafts PHP Backend
 */

// Use Environment Variables for Render, fallback to XAMPP defaults for local
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'zambosur_db');

// Create database connection
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        // Log the error internally but don't show passwords in the JSON output
        error_log('Database connection failed: ' . $conn->connect_error);
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed. Please check server logs.']));
    }
    
    $conn->set_charset("utf8mb4");
    
    return $conn;
}

// Set headers for JSON API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

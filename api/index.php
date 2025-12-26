<?php
// Router principal para Vercel
// Este archivo maneja todas las peticiones y redirige al archivo PHP correspondiente

$request_uri = $_SERVER['REQUEST_URI'];
$parsed_url = parse_url($request_uri);
$path = $parsed_url['path'] ?? '/';

// Eliminar query string para obtener solo la ruta
$path = strtok($path, '?');

// Si es la raíz, redirigir a login
if ($path === '/' || $path === '') {
    $path = '/login.php';
}

// Construir la ruta del archivo
$file_path = __DIR__ . '/..' . $path;

// Si es un archivo PHP y existe, ejecutarlo
if (preg_match('/\.php$/', $path) && file_exists($file_path)) {
    chdir(dirname($file_path));
    require $file_path;
    exit;
}

// Si es un archivo estático, servirlo
if (file_exists($file_path) && is_file($file_path)) {
    return false; // Dejar que Vercel maneje archivos estáticos
}

// Si no existe, redirigir a login
header('Location: /login.php');
exit;

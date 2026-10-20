<?php
declare(strict_types=1);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$public = realpath(__DIR__ . '/../app/public');
$file = realpath($public . $path);
if ($path !== '/' && $file && str_starts_with($file, $public . DIRECTORY_SEPARATOR) && is_file($file)) return false;
require $public . '/index.php';

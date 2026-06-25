<?php
declare(strict_types=1);

use Fsss\Api\Support\Env;
use Fsss\Api\Support\HttpException;
use Fsss\Api\Support\Request;
use Fsss\Api\Support\Response;
use Fsss\Api\Support\Router;

spl_autoload_register(static function (string $class): void {
    $prefix = 'Fsss\\Api\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) {
        require $path;
    }
});

Env::load(__DIR__ . '/../.env');

$timezone = Env::get('APP_TIMEZONE', 'America/Sao_Paulo');
date_default_timezone_set($timezone);

$env = Env::get('APP_ENV', 'local');
$debug = Env::bool('APP_DEBUG', $env !== 'production');

error_reporting(E_ALL);
ini_set('display_errors', $debug ? '1' : '0');
ini_set('log_errors', '1');

$sessionName = Env::get('SESSION_NAME', 'fsss_session');
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name($sessionName);
    session_start();
}

$request = Request::fromGlobals();

$origin = $request->header('Origin');
$allowedOrigins = Env::csv('CORS_ALLOWED_ORIGINS');
if ($origin !== null && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if ($request->method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$router = new Router();
$routes = require __DIR__ . '/routes.php';
$routes($router);

try {
    $router->dispatch($request);
} catch (HttpException $e) {
    Response::problem($e->getMessage(), $e->status, $e->details);
} catch (Throwable $e) {
    if ($debug) {
        Response::problem($e->getMessage(), 500, [
            'trace' => $e->getTraceAsString(),
        ]);
    }

    Response::problem('Internal server error', 500);
}

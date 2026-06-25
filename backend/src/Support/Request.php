<?php
declare(strict_types=1);

namespace Fsss\Api\Support;

final class Request
{
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $headers,
        public readonly array $body
    ) {
    }

    public static function fromGlobals(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
        $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

        if ($scriptDir !== '' && $scriptDir !== '/' && str_starts_with($uriPath, $scriptDir)) {
            $uriPath = substr($uriPath, strlen($scriptDir));
        }

        $path = '/' . ltrim($uriPath, '/');
        $path = $path === '//' ? '/' : rtrim($path, '/') ?: '/';

        $headers = function_exists('getallheaders') ? array_change_key_case(getallheaders(), CASE_LOWER) : [];
        $body = self::parseBody();

        return new self(
            $method,
            $path,
            $_GET,
            $headers,
            $body
        );
    }

    public function header(string $name): ?string
    {
        $key = strtolower($name);
        return $this->headers[$key] ?? null;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }

    private static function parseBody(): array
    {
        $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

        if (str_contains($contentType, 'application/json')) {
            $decoded = json_decode(file_get_contents('php://input') ?: '', true);
            return is_array($decoded) ? $decoded : [];
        }

        if (str_contains($contentType, 'multipart/form-data')) {
            return array_merge($_POST, ['__files' => $_FILES]);
        }

        return $_POST;
    }
}

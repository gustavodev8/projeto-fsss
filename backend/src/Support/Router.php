<?php
declare(strict_types=1);

namespace Fsss\Api\Support;

final class Router
{
    /** @var array<int, array{method:string, pattern:string, handler:callable}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->map('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->map('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->map('PUT', $pattern, $handler);
    }

    public function patch(string $pattern, callable $handler): void
    {
        $this->map('PATCH', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->map('DELETE', $pattern, $handler);
    }

    public function dispatch(Request $request): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }

            $params = $this->match($route['pattern'], $request->path);
            if ($params === null) {
                continue;
            }

            $result = ($route['handler'])($request, $params);
            if ($result === null) {
                Response::noContent();
            }

            if (is_array($result)) {
                Response::json($result);
            }

            Response::json(['data' => $result]);
        }

        throw new HttpException(404, 'Route not found');
    }

    private function map(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = compact('method', 'pattern', 'handler');
    }

    private function match(string $pattern, string $path): ?array
    {
        $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . rtrim((string) $regex, '/') . '/?$#';

        if (!preg_match($regex, $path, $matches)) {
            return null;
        }

        $params = [];
        foreach ($matches as $key => $value) {
            if (is_string($key)) {
                $params[$key] = $value;
            }
        }

        return $params;
    }
}

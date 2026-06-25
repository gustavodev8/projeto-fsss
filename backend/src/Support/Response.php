<?php
declare(strict_types=1);

namespace Fsss\Api\Support;

final class Response
{
    public static function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function problem(string $message, int $status = 400, array $details = []): void
    {
        $payload = ['error' => $message];
        if ($details !== []) {
            $payload['details'] = $details;
        }

        self::json($payload, $status);
    }

    public static function noContent(): void
    {
        http_response_code(204);
        exit;
    }
}

<?php
declare(strict_types=1);

namespace Fsss\Api\Support;

final class Auth
{
    public static function user(): ?array
    {
        if (self::isExpired()) {
            self::clear();
            return null;
        }

        return $_SESSION['user'] ?? null;
    }

    public static function requireLogin(): array
    {
        $user = self::user();
        if ($user === null) {
            throw new HttpException(401, 'Authentication required');
        }

        return $user;
    }

    public static function requireAdmin(): array
    {
        $user = self::requireLogin();
        if (($user['role'] ?? null) !== 'admin') {
            throw new HttpException(403, 'Admin access required');
        }

        return $user;
    }

    public static function storeUser(array $user): void
    {
        $_SESSION['user'] = $user;
        $_SESSION['expires_at'] = time() + ((int) Env::get('SESSION_TTL_HOURS', '8')) * 3600;
    }

    public static function isExpired(): bool
    {
        $expiresAt = (int) ($_SESSION['expires_at'] ?? 0);
        return $expiresAt > 0 && time() > $expiresAt;
    }

    public static function clear(): void
    {
        unset($_SESSION['user'], $_SESSION['expires_at']);
        session_regenerate_id(true);
    }
}

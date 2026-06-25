<?php
declare(strict_types=1);

namespace Fsss\Api\Services;

use Fsss\Api\Repositories\UserRepository;
use Fsss\Api\Support\HttpException;

final class AuthService
{
    private readonly UserRepository $users;

    public function __construct(?UserRepository $users = null)
    {
        $this->users = $users ?? new UserRepository();
    }

    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail($email);
        if ($user === null || (int) $user['active'] !== 1) {
            throw new HttpException(401, 'Invalid credentials');
        }

        if (!password_verify($password, $user['password_hash'])) {
            throw new HttpException(401, 'Invalid credentials');
        }

        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ];
    }
}

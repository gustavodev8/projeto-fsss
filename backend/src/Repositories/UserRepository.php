<?php
declare(strict_types=1);

namespace Fsss\Api\Repositories;

final class UserRepository extends BaseRepository
{
    public function findByEmail(string $email): ?array
    {
        return $this->fetchOne(
            'SELECT id, name, email, password_hash, role, active FROM users WHERE email = :email LIMIT 1',
            ['email' => $email]
        );
    }

    public function findById(string $id): ?array
    {
        return $this->fetchOne(
            'SELECT id, name, email, role, active, created_at FROM users WHERE id = :id LIMIT 1',
            ['id' => $id]
        );
    }

    public function listProfessors(): array
    {
        return $this->fetchAll(
            "SELECT id, name, email, active, created_at FROM users WHERE role = 'professor' ORDER BY name"
        );
    }

    public function createProfessor(string $name, string $email, string $passwordHash): string
    {
        $id = $this->uuid();
        $this->execute(
            "INSERT INTO users (id, name, email, password_hash, role, active) VALUES (:id, :name, :email, :password_hash, 'professor', 1)",
            [
                'id' => $id,
                'name' => $name,
                'email' => $email,
                'password_hash' => $passwordHash,
            ]
        );

        return $id;
    }

    public function updateProfessor(string $id, string $name, string $email, ?string $passwordHash = null): void
    {
        if ($passwordHash === null) {
            $this->execute(
                "UPDATE users SET name = :name, email = :email, updated_at = NOW() WHERE id = :id AND role = 'professor'",
                ['id' => $id, 'name' => $name, 'email' => $email]
            );
            return;
        }

        $this->execute(
            "UPDATE users SET name = :name, email = :email, password_hash = :password_hash, updated_at = NOW() WHERE id = :id AND role = 'professor'",
            ['id' => $id, 'name' => $name, 'email' => $email, 'password_hash' => $passwordHash]
        );
    }

    public function deactivateProfessor(string $id): void
    {
        $this->execute(
            "UPDATE users SET active = 0, updated_at = NOW() WHERE id = :id AND role = 'professor'",
            ['id' => $id]
        );
    }

    public function hasActiveAdmin(string $id): bool
    {
        return $this->fetchOne(
            "SELECT 1 FROM users WHERE id = :id AND role = 'admin' AND active = 1 LIMIT 1",
            ['id' => $id]
        ) !== null;
    }

    private function uuid(): string
    {
        return bin2hex(random_bytes(16));
    }
}

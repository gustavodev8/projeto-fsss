<?php
declare(strict_types=1);

namespace Fsss\Api\Services;

use Fsss\Api\Repositories\BlockedDateRepository;
use Fsss\Api\Repositories\UserRepository;
use Fsss\Api\Support\Auth;
use Fsss\Api\Support\HttpException;

final class AdminService
{
    private readonly UserRepository $users;
    private readonly BlockedDateRepository $blockedDates;

    public function __construct(?UserRepository $users = null, ?BlockedDateRepository $blockedDates = null)
    {
        $this->users = $users ?? new UserRepository();
        $this->blockedDates = $blockedDates ?? new BlockedDateRepository();
    }

    public function listProfessors(): array
    {
        Auth::requireAdmin();
        return $this->users->listProfessors();
    }

    public function createProfessor(array $payload): array
    {
        Auth::requireAdmin();

        $name = trim((string) ($payload['name'] ?? ''));
        $email = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($name === '' || $email === '' || $password === '') {
            throw new HttpException(422, 'Invalid professor payload');
        }

        $id = $this->users->createProfessor($name, $email, password_hash($password, PASSWORD_DEFAULT));
        return $this->users->findById($id) ?? [];
    }

    public function updateProfessor(string $id, array $payload): array
    {
        Auth::requireAdmin();

        $name = trim((string) ($payload['name'] ?? ''));
        $email = trim((string) ($payload['email'] ?? ''));
        $password = trim((string) ($payload['password'] ?? ''));

        if ($name === '' || $email === '') {
            throw new HttpException(422, 'Invalid professor payload');
        }

        $this->users->updateProfessor($id, $name, $email, $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : null);
        return $this->users->findById($id) ?? [];
    }

    public function deactivateProfessor(string $id): void
    {
        Auth::requireAdmin();
        $this->users->deactivateProfessor($id);
    }

    public function listBlockedDates(): array
    {
        Auth::requireLogin();
        return $this->blockedDates->listAll();
    }

    public function createBlockedDate(array $payload): array
    {
        Auth::requireAdmin();

        $date = trim((string) ($payload['data'] ?? $payload['date'] ?? ''));
        $reason = trim((string) ($payload['motivo'] ?? $payload['reason'] ?? 'Bloqueado'));

        if ($date === '') {
            throw new HttpException(422, 'Invalid blocked date payload');
        }

        if ($this->blockedDates->existsForDate($date) !== null) {
            throw new HttpException(409, 'This date is already blocked');
        }

        $id = $this->blockedDates->create($date, $reason);
        return $this->blockedDates->existsForDate($date) ?? ['id' => $id, 'data' => $date, 'motivo' => $reason];
    }

    public function deleteBlockedDate(string $id): void
    {
        Auth::requireAdmin();
        $this->blockedDates->delete($id);
    }
}

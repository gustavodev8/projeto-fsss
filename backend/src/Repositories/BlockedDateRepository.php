<?php
declare(strict_types=1);

namespace Fsss\Api\Repositories;

final class BlockedDateRepository extends BaseRepository
{
    public function listAll(): array
    {
        return $this->fetchAll(
            'SELECT id, blocked_date AS data, reason AS motivo, created_at AS criado_em FROM blocked_dates ORDER BY blocked_date'
        );
    }

    public function create(string $date, string $reason): string
    {
        $id = $this->uuid();
        $this->execute(
            'INSERT INTO blocked_dates (id, blocked_date, reason) VALUES (:id, :blocked_date, :reason)',
            [
                'id' => $id,
                'blocked_date' => $date,
                'reason' => $reason,
            ]
        );

        return $id;
    }

    public function delete(string $id): void
    {
        $this->execute('DELETE FROM blocked_dates WHERE id = :id', ['id' => $id]);
    }

    public function existsForDate(string $date): ?array
    {
        return $this->fetchOne(
            'SELECT id, blocked_date AS data, reason AS motivo, created_at AS criado_em FROM blocked_dates WHERE blocked_date = :date LIMIT 1',
            ['date' => $date]
        );
    }

    private function uuid(): string
    {
        return bin2hex(random_bytes(16));
    }
}

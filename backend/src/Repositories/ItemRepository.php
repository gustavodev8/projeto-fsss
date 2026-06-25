<?php
declare(strict_types=1);

namespace Fsss\Api\Repositories;

final class ItemRepository extends BaseRepository
{
    public function listAll(?string $category = null, bool $onlyAvailable = true): array
    {
        $sql = 'SELECT id, name, description, category, image_url, available, total_units, created_at, updated_at FROM items';
        $where = [];
        $params = [];

        if ($category !== null && $category !== '') {
            $where[] = 'category = :category';
            $params['category'] = $category;
        }

        if ($onlyAvailable) {
            $where[] = 'available = 1';
        }

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY category, name';
        return $this->fetchAll($sql, $params);
    }

    public function findById(string $id): ?array
    {
        return $this->fetchOne(
            'SELECT id, name, description, category, image_url, available, total_units, created_at, updated_at FROM items WHERE id = :id LIMIT 1',
            ['id' => $id]
        );
    }

    public function create(string $name, string $description, string $category, ?string $imageUrl, ?int $totalUnits): string
    {
        $id = $this->uuid();
        $this->execute(
            'INSERT INTO items (id, name, description, category, image_url, available, total_units) VALUES (:id, :name, :description, :category, :image_url, 1, :total_units)',
            [
                'id' => $id,
                'name' => $name,
                'description' => $description,
                'category' => $category,
                'image_url' => $imageUrl,
                'total_units' => $totalUnits,
            ]
        );

        return $id;
    }

    public function update(string $id, string $name, string $description, ?string $imageUrl, ?int $totalUnits): void
    {
        $this->execute(
            'UPDATE items SET name = :name, description = :description, image_url = :image_url, total_units = :total_units, updated_at = NOW() WHERE id = :id',
            [
                'id' => $id,
                'name' => $name,
                'description' => $description,
                'image_url' => $imageUrl,
                'total_units' => $totalUnits,
            ]
        );
    }

    public function softDelete(string $id): void
    {
        $this->execute(
            'UPDATE items SET available = 0, updated_at = NOW() WHERE id = :id',
            ['id' => $id]
        );
    }

    public function countReservations(string $itemId): int
    {
        $row = $this->fetchOne(
            'SELECT COUNT(*) AS total FROM reservations WHERE item_id = :item_id',
            ['item_id' => $itemId]
        );

        return (int) ($row['total'] ?? 0);
    }

    public function cancelActiveReservations(string $itemId): void
    {
        $this->execute(
            "UPDATE reservations SET status = 'cancelada', cancelled_at = NOW(), updated_at = NOW() WHERE item_id = :item_id AND status = 'confirmada'",
            ['item_id' => $itemId]
        );
    }

    private function uuid(): string
    {
        return bin2hex(random_bytes(16));
    }
}

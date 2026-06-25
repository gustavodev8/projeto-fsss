<?php
declare(strict_types=1);

namespace Fsss\Api\Repositories;

use PDO;

final class ReservationRepository extends BaseRepository
{
    public function listActive(): array
    {
        return $this->fetchAll(
            "SELECT * FROM vw_reservations_detailed WHERE status = 'confirmada' ORDER BY created_at DESC"
        );
    }

    public function listCancelled(?string $userEmail = null): array
    {
        $sql = "SELECT * FROM vw_reservations_detailed WHERE status = 'cancelada'";
        $params = [];

        if ($userEmail !== null && $userEmail !== '') {
            $sql .= ' AND user_email = :user_email';
            $params['user_email'] = $userEmail;
        }

        $sql .= ' ORDER BY cancelled_at DESC, created_at DESC';
        return $this->fetchAll($sql, $params);
    }

    public function listByUser(string $userId): array
    {
        return $this->fetchAll(
            "SELECT * FROM vw_reservations_detailed WHERE user_id = :user_id AND status = 'confirmada' ORDER BY created_at DESC",
            ['user_id' => $userId]
        );
    }

    public function findReservation(string $reservationId): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM vw_reservations_detailed WHERE reservation_id = :reservation_id LIMIT 1',
            ['reservation_id' => $reservationId]
        );
    }

    public function findByGroupId(string $groupId): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM vw_reservations_detailed WHERE group_id = :group_id LIMIT 1',
            ['group_id' => $groupId]
        );
    }

    public function timeSlotIdsByLabels(array $labels): array
    {
        if ($labels === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($labels), '?'));
        $stmt = $this->pdo->prepare(
            'SELECT id, label, is_break FROM time_slots WHERE label IN (' . $placeholders . ') ORDER BY sort_order'
        );
        $stmt->execute(array_values($labels));

        return $stmt->fetchAll();
    }

    public function occupiedUnits(string $itemId, string $date, int $slotId): int
    {
        $row = $this->fetchOne(
            "SELECT COALESCE(SUM(r.quantity), 0) AS total
             FROM reservations r
             INNER JOIN reservation_slots rs ON rs.reservation_id = r.id
             WHERE r.item_id = :item_id
               AND r.reservation_date = :reservation_date
               AND rs.time_slot_id = :time_slot_id
               AND r.status = 'confirmada'",
            [
                'item_id' => $itemId,
                'reservation_date' => $date,
                'time_slot_id' => $slotId,
            ]
        );

        return (int) ($row['total'] ?? 0);
    }

    public function create(
        string $userId,
        string $itemId,
        string $date,
        int $quantity,
        ?string $groupId,
        array $slotIds
    ): string {
        $id = $this->uuid();

        $this->execute(
            "INSERT INTO reservations (id, group_id, user_id, item_id, reservation_date, quantity, status)
             VALUES (:id, :group_id, :user_id, :item_id, :reservation_date, :quantity, 'confirmada')",
            [
                'id' => $id,
                'group_id' => $groupId,
                'user_id' => $userId,
                'item_id' => $itemId,
                'reservation_date' => $date,
                'quantity' => $quantity,
            ]
        );

        $stmt = $this->pdo->prepare(
            'INSERT INTO reservation_slots (reservation_id, time_slot_id) VALUES (:reservation_id, :time_slot_id)'
        );
        foreach ($slotIds as $slotId) {
            $stmt->execute([
                'reservation_id' => $id,
                'time_slot_id' => $slotId,
            ]);
        }

        return $id;
    }

    public function cancelById(string $reservationId): void
    {
        $this->execute(
            "UPDATE reservations SET status = 'cancelada', cancelled_at = NOW(), updated_at = NOW() WHERE id = :id",
            ['id' => $reservationId]
        );
    }

    public function cancelByGroup(string $groupId): void
    {
        $this->execute(
            "UPDATE reservations SET status = 'cancelada', cancelled_at = NOW(), updated_at = NOW() WHERE group_id = :group_id",
            ['group_id' => $groupId]
        );
    }

    private function uuid(): string
    {
        return bin2hex(random_bytes(16));
    }
}

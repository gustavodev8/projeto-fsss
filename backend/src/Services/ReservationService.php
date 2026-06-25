<?php
declare(strict_types=1);

namespace Fsss\Api\Services;

use Fsss\Api\Repositories\ItemRepository;
use Fsss\Api\Repositories\ReservationRepository;
use Fsss\Api\Repositories\UserRepository;
use Fsss\Api\Support\Auth;
use Fsss\Api\Support\Database;
use Fsss\Api\Support\HttpException;

final class ReservationService
{
    private readonly ReservationRepository $reservations;
    private readonly ItemRepository $items;
    private readonly UserRepository $users;

    public function __construct(
        ?ReservationRepository $reservations = null,
        ?ItemRepository $items = null,
        ?UserRepository $users = null
    ) {
        $this->reservations = $reservations ?? new ReservationRepository();
        $this->items = $items ?? new ItemRepository();
        $this->users = $users ?? new UserRepository();
    }

    public function listAll(): array
    {
        Auth::requireLogin();
        return $this->mapReservations($this->reservations->listActive());
    }

    public function listMine(string $userId): array
    {
        Auth::requireLogin();
        return $this->mapReservations($this->reservations->listByUser($userId));
    }

    public function listCancelled(?string $userEmail = null): array
    {
        Auth::requireLogin();
        return $this->mapReservations($this->reservations->listCancelled($userEmail));
    }

    public function create(array $payload): array
    {
        $user = Auth::requireLogin();

        $userId = (string) ($payload['user_id'] ?? $user['id']);
        if ($userId !== $user['id'] && ($user['role'] ?? null) !== 'admin') {
            throw new HttpException(403, 'Cannot create reservations for another user');
        }

        $itemId = trim((string) ($payload['item_id'] ?? ''));
        $date = trim((string) ($payload['date'] ?? ''));
        $quantity = max(1, (int) ($payload['quantity'] ?? 1));
        $groupId = $this->nullableString($payload['group_id'] ?? null);
        $slots = array_values(array_filter(array_map('trim', (array) ($payload['time_slots'] ?? []))));

        if ($itemId === '' || $date === '' || $slots === []) {
            throw new HttpException(422, 'Invalid reservation payload');
        }

        $item = $this->items->findById($itemId);
        if ($item === null || (int) $item['available'] !== 1) {
            throw new HttpException(404, 'Item not found');
        }

        $availableUnits = (int) ($item['total_units'] ?? 1);
        $slotRows = $this->reservations->timeSlotIdsByLabels($slots);
        $slotRows = array_values(array_filter($slotRows, static fn (array $slot) => (int) $slot['is_break'] !== 1));

        if ($slotRows === []) {
            throw new HttpException(422, 'No valid time slots found');
        }

        return Database::transaction(function () use ($userId, $item, $date, $quantity, $groupId, $slotRows, $availableUnits) {
            foreach ($slotRows as $slot) {
                $occupied = $this->reservations->occupiedUnits((string) $item['id'], $date, (int) $slot['id']);
                if ($occupied + $quantity > $availableUnits) {
                    throw new HttpException(409, 'SLOT_UNAVAILABLE:' . $slot['label']);
                }
            }

            $reservationId = $this->reservations->create(
                $userId,
                (string) $item['id'],
                $date,
                $quantity,
                $groupId,
                array_map(static fn (array $slot) => (int) $slot['id'], $slotRows)
            );

            $reservation = $this->reservations->findReservation($reservationId);
            if ($reservation === null) {
                throw new HttpException(500, 'Reservation could not be loaded');
            }

            return $this->mapReservation($reservation);
        });
    }

    public function cancelById(string $reservationId): void
    {
        $user = Auth::requireLogin();
        $reservation = $this->reservations->findReservation($reservationId);
        if ($reservation === null) {
            throw new HttpException(404, 'Reservation not found');
        }

        if (($user['role'] ?? null) !== 'admin' && ($reservation['user_id'] ?? null) !== $user['id']) {
            throw new HttpException(403, 'Not allowed to cancel this reservation');
        }

        $this->reservations->cancelById($reservationId);
    }

    public function cancelByGroup(string $groupId): void
    {
        $user = Auth::requireLogin();
        $reservation = $this->reservations->findByGroupId($groupId);
        if ($reservation === null) {
            throw new HttpException(404, 'Reservation group not found');
        }

        if (($user['role'] ?? null) !== 'admin' && ($reservation['user_id'] ?? null) !== $user['id']) {
            throw new HttpException(403, 'Not allowed to cancel this reservation group');
        }

        $this->reservations->cancelByGroup($groupId);
    }

    private function mapReservations(array $rows): array
    {
        return array_map([$this, 'mapReservation'], $rows);
    }

    private function mapReservation(array $row): array
    {
        $labels = $row['time_slots'] ?? $row['time_labels'] ?? '';
        $slots = $labels === '' ? [] : explode('||', (string) $labels);

        return [
            'id' => $row['reservation_id'],
            'groupId' => $row['group_id'] !== null ? $row['group_id'] : null,
            'itemId' => $row['item_id'],
            'itemName' => $row['item_name'],
            'date' => $row['reservation_date'],
            'slots' => $slots,
            'quantity' => (int) ($row['quantity'] ?? 1),
            'category' => $row['item_category'],
            'userName' => $row['user_name'],
            'userEmail' => $row['user_email'],
            'cancelledAt' => $row['cancelled_at'] !== null ? $row['cancelled_at'] : null,
        ];
    }

    private function nullableString(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : '';
        return $value === '' ? null : $value;
    }
}

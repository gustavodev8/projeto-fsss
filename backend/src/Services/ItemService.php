<?php
declare(strict_types=1);

namespace Fsss\Api\Services;

use Fsss\Api\Repositories\ItemRepository;
use Fsss\Api\Support\Auth;
use Fsss\Api\Support\HttpException;

final class ItemService
{
    private readonly ItemRepository $items;

    public function __construct(?ItemRepository $items = null)
    {
        $this->items = $items ?? new ItemRepository();
    }

    public function list(?string $category = null, bool $onlyAvailable = true): array
    {
        return array_map([$this, 'mapItem'], $this->items->listAll($category, $onlyAvailable));
    }

    public function find(string $id): array
    {
        $item = $this->items->findById($id);
        if ($item === null) {
            throw new HttpException(404, 'Item not found');
        }

        return $this->mapItem($item);
    }

    public function create(array $payload): array
    {
        Auth::requireAdmin();

        $name = trim((string) ($payload['name'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $category = (string) ($payload['category'] ?? '');
        $imageUrl = $this->nullableString($payload['image_url'] ?? null);
        $totalUnits = $this->nullableInt($payload['total_units'] ?? null);

        if ($name === '' || $description === '' || !in_array($category, ['espacos', 'instrumentos'], true)) {
            throw new HttpException(422, 'Invalid item payload');
        }

        if ($category === 'espacos') {
            $totalUnits = null;
        } elseif ($totalUnits === null || $totalUnits < 1) {
            throw new HttpException(422, 'Instrument items require total_units');
        }

        $id = $this->items->create($name, $description, $category, $imageUrl, $totalUnits);
        return $this->find($id);
    }

    public function update(string $id, array $payload): array
    {
        Auth::requireAdmin();

        $existing = $this->items->findById($id);
        if ($existing === null) {
            throw new HttpException(404, 'Item not found');
        }

        $name = trim((string) ($payload['name'] ?? $existing['name']));
        $description = trim((string) ($payload['description'] ?? $existing['description']));
        $imageUrl = $this->nullableString($payload['image_url'] ?? $existing['image_url']);
        $totalUnits = $this->nullableInt($payload['total_units'] ?? $existing['total_units']);

        if ($existing['category'] === 'espacos') {
            $totalUnits = null;
        } elseif ($totalUnits === null || $totalUnits < 1) {
            throw new HttpException(422, 'Instrument items require total_units');
        }

        $this->items->update($id, $name, $description, $imageUrl, $totalUnits);
        return $this->find($id);
    }

    public function delete(string $id): void
    {
        Auth::requireAdmin();
        $existing = $this->items->findById($id);
        if ($existing === null) {
            throw new HttpException(404, 'Item not found');
        }

        $this->items->softDelete($id);
    }

    public function forceDelete(string $id): void
    {
        Auth::requireAdmin();
        $existing = $this->items->findById($id);
        if ($existing === null) {
            throw new HttpException(404, 'Item not found');
        }

        $this->items->cancelActiveReservations($id);
        $this->items->softDelete($id);
    }

    private function mapItem(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'description' => $row['description'] ?? '',
            'category' => $row['category'],
            'image' => $row['image_url'] ?? '',
            'available' => (int) $row['available'] === 1,
            'totalUnits' => $row['total_units'] !== null ? (int) $row['total_units'] : null,
            'availableUnits' => $this->availableUnits($row),
        ];
    }

    private function availableUnits(array $row): ?int
    {
        return $row['category'] === 'instrumentos' && $row['total_units'] !== null
            ? (int) $row['total_units']
            : null;
    }

    private function nullableString(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : '';
        return $value === '' ? null : $value;
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }
}

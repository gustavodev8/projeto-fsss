<?php
declare(strict_types=1);

namespace Fsss\Api\Repositories;

final class TimeSlotRepository extends BaseRepository
{
    public function listAll(): array
    {
        return $this->fetchAll(
            'SELECT id, label, start_time, end_time, is_break, sort_order FROM time_slots ORDER BY sort_order'
        );
    }
}

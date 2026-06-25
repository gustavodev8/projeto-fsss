<?php
declare(strict_types=1);

namespace Fsss\Api\Support;

use RuntimeException;

final class HttpException extends RuntimeException
{
    public function __construct(
        public readonly int $status,
        string $message,
        public readonly array $details = []
    ) {
        parent::__construct($message, $status);
    }
}

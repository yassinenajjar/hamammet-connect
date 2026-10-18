<?php

namespace App\Services;

use RuntimeException;

class GeminiRequestException extends RuntimeException
{
    public function __construct(public readonly int $upstreamStatus)
    {
        parent::__construct('Gemini returned HTTP '.$upstreamStatus);
    }
}

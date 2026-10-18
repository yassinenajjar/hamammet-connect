<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportAssignmentHistory extends Model
{
    protected $fillable = [
        'from_service_id',
        'to_service_id',
        'author_id',
        'reason',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return ['occurred_at' => 'immutable_datetime'];
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}

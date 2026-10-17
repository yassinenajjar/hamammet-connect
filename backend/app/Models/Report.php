<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    use HasFactory;

    public const STATUSES = ['new', 'in_progress', 'transferred', 'resolved', 'rejected'];

    public const URGENCIES = ['critical', 'high', 'normal'];

    protected $fillable = [
        'reference',
        'title',
        'description',
        'category',
        'urgency',
        'status',
        'contributions_count',
        'location',
        'latitude',
        'longitude',
        'submitted_at',
        'municipal_service_id',
    ];

    protected function casts(): array
    {
        return [
            'contributions_count' => 'integer',
            'latitude' => 'float',
            'longitude' => 'float',
            'submitted_at' => 'immutable_datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'reference';
    }

    public function municipalService(): BelongsTo
    {
        return $this->belongsTo(MunicipalService::class);
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(Evidence::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(ReportStatusHistory::class)->orderBy('occurred_at');
    }

    public function staffNotes(): HasMany
    {
        return $this->hasMany(StaffNote::class)->latest();
    }
}

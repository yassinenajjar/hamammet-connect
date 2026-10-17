<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MunicipalService extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'assigned_service_name',
        'key',
        'agent_count',
        'resolution_rate',
    ];

    protected function casts(): array
    {
        return [
            'agent_count' => 'integer',
            'resolution_rate' => 'integer',
        ];
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }
}

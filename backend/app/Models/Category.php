<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Category extends Model
{
    protected $fillable = ['name', 'key', 'municipal_service_id', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function municipalService(): BelongsTo
    {
        return $this->belongsTo(MunicipalService::class);
    }
}

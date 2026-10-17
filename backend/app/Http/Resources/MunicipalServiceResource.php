<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MunicipalServiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'agents' => $this->agent_count.' agents',
            'percent' => $this->resolution_rate.'%',
            'key' => $this->key,
            'category' => $this->category,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $contributions = $this->contributions_count;

        return [
            'id' => $this->reference,
            'reference' => $this->reference,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'urgency' => $this->urgency,
            'status' => $this->status,
            'reports' => $contributions,
            'location' => $this->location,
            'coordinates' => [(float) $this->latitude, (float) $this->longitude],
            'date' => $this->submitted_at->locale('fr')->translatedFormat('d M Y'),
            'submitted_at' => $this->submitted_at->toIso8601String(),
            'importance' => $contributions >= 5 ? 'Ã‰levÃ©e' : ($contributions >= 3 ? 'Moyenne' : 'Courante'),
            'assigned_service' => $this->municipalService->assigned_service_name,
            'evidence' => $this->evidence->map(fn ($item): array => [
                'id' => $item->id,
                'url' => Storage::disk($item->storage_disk)->url($item->storage_path),
                'original_name' => $item->original_name,
                'mime_type' => $item->mime_type,
                'storage_disk' => $item->storage_disk,
                'storage_path' => $item->storage_path,
                'size' => $item->size,
                'uploaded_at' => $item->created_at?->toIso8601String(),
            ])->values(),
            'history' => $this->history->map(fn ($item): array => [
                'from_status' => $item->from_status,
                'to_status' => $item->to_status,
                'occurred_at' => $item->occurred_at->toIso8601String(),
                'rejection_reason' => $item->rejection_reason,
                'note' => $item->note,
            ])->values(),
            'staff_notes' => $this->staffNotes->map(fn ($item): array => [
                'note' => $item->note,
                'created_at' => $item->created_at->toIso8601String(),
            ])->values(),
        ];
    }
}

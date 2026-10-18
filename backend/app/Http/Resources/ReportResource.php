<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

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
            'location' => $this->location ?? '',
            'coordinates' => $this->latitude !== null && $this->longitude !== null
                ? [(float) $this->latitude, (float) $this->longitude]
                : null,
            'date' => $this->submitted_at->locale('fr')->translatedFormat('d M Y'),
            'submitted_at' => $this->submitted_at->toIso8601String(),
            'importance' => $contributions >= 5 ? 'Élevée' : ($contributions >= 3 ? 'Moyenne' : 'Courante'),
            'assigned_service' => $this->municipalService?->assigned_service_name,
            'municipal_service_id' => $this->municipal_service_id,
            'evidence' => $this->evidence->map(fn ($item): array => [
                'id' => $item->id,
                'url' => URL::temporarySignedRoute('reports.evidence', now()->addMinutes(5), ['report' => $this->reference, 'evidence' => $item->id]),
                'original_name' => $item->original_name,
                'mime_type' => $item->mime_type,
                'size' => $item->size,
                'uploaded_at' => $item->created_at?->toIso8601String(),
            ])->values(),
            'history' => $this->history->map(fn ($item): array => [
                'from_status' => $item->from_status,
                'to_status' => $item->to_status,
                'occurred_at' => $item->occurred_at->toIso8601String(),
                'rejection_reason' => $item->rejection_reason,
                'note' => $item->note,
                'author' => $item->author?->name,
            ])->values(),
            'staff_notes' => $this->staffNotes->map(fn ($item): array => [
                'note' => $item->note,
                'created_at' => $item->created_at->toIso8601String(),
                'author' => $item->author?->name,
            ])->values(),
            'assignment_history' => $this->assignmentHistory->map(fn ($item): array => [
                'from_service_id' => $item->from_service_id,
                'to_service_id' => $item->to_service_id,
                'reason' => $item->reason,
                'occurred_at' => $item->occurred_at->toIso8601String(),
                'author' => $item->author?->name,
            ])->values(),
            'urgency_history' => $this->urgencyHistory->map(fn ($item): array => [
                'from_urgency' => $item->from_urgency,
                'to_urgency' => $item->to_urgency,
                'rationale' => $item->rationale,
                'occurred_at' => $item->occurred_at->toIso8601String(),
                'author' => $item->author?->name,
            ])->values(),
        ];
    }
}

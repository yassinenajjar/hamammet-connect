<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\MunicipalService;
use App\Models\Category;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Report::query()->with(['municipalService', 'evidence', 'history.author', 'staffNotes.author', 'assignmentHistory.author', 'urgencyHistory.author']);

        foreach (['status', 'urgency', 'category', 'municipal_service_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        if ($request->filled('q')) {
            $term = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $request->string('q')->toString()).'%';
            $query->where(fn ($builder) => $builder->where('title', 'like', $term)
                ->orWhere('reference', 'like', $term)
                ->orWhere('location', 'like', $term));
        }

        return response()->json(ReportResource::collection($query->orderByDesc('submitted_at')->paginate(50)));
    }

    public function show(Report $report): JsonResponse
    {
        $report->load(['municipalService', 'evidence', 'history.author', 'staffNotes.author', 'assignmentHistory.author', 'urgencyHistory.author']);

        return response()->json(ReportResource::make($report)->resolve());
    }

    public function create(StoreReportRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = Auth::guard('sanctum')->user();
        $trackingSecret = $user ? null : Str::random(64);
        $category = trim($validated['category']);
        $reportCategory = Category::query()->where('name', $category)->firstOrFail();
        $service = $reportCategory->municipal_service_id
            ? MunicipalService::query()->find($reportCategory->municipal_service_id)
            : null;

        $report = DB::transaction(function () use ($validated, $user, $trackingSecret, $category, $reportCategory, $service): Report {
            $report = Report::query()->create([
                'reference' => $this->newReference(),
                'reporter_id' => $user?->id,
                'tracking_secret_hash' => $trackingSecret ? hash('sha256', $trackingSecret) : null,
                'title' => trim($validated['title']),
                'description' => trim($validated['description']),
                'category' => $category,
                'category_id' => $reportCategory->id,
                'urgency' => null,
                'status' => 'new',
                'contributions_count' => 1,
                'location' => isset($validated['location']) ? trim($validated['location']) : null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'submitted_at' => now(),
                'municipal_service_id' => $service?->id,
            ]);

            $report->history()->create([
                'from_status' => null,
                'to_status' => 'new',
                'occurred_at' => now(),
                'note' => 'Signalement enregistré.',
            ]);

            foreach ($validated['evidence'] ?? [] as $file) {
                $path = $file->store('reports/'.$report->id, 'local');
                $report->evidence()->create([
                    'uploaded_by' => $user?->id,
                    'storage_disk' => 'local',
                    'storage_path' => $path,
                    'original_name' => mb_substr($file->getClientOriginalName(), 0, 255),
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);
            }

            return $report;
        });

        return response()->json([
            'data' => [
                'reference' => $report->reference,
                'status' => $report->status,
                'submitted_at' => $report->submitted_at->toIso8601String(),
                'tracking_secret' => $trackingSecret,
            ],
        ], 201);
    }

    public function mine(Request $request): JsonResponse
    {
        $reports = $request->user()->reports()->with('municipalService')->orderByDesc('submitted_at')->paginate(20);

        return response()->json(['data' => $reports->getCollection()->map(fn (Report $report): array => $this->citizenReport($report)), 'meta' => [
            'current_page' => $reports->currentPage(), 'last_page' => $reports->lastPage(), 'total' => $reports->total(),
        ]]);
    }

    public function mineShow(Request $request, Report $report): JsonResponse
    {
        abort_unless($report->reporter_id === $request->user()->id, 404);
        $report->load('municipalService');

        return response()->json(['data' => $this->citizenReport($report)]);
    }

    public function track(Request $request, Report $report): JsonResponse
    {
        $request->validate(['tracking_secret' => ['required', 'string', 'max:128']]);
        abort_if($report->reporter_id !== null || ! $report->tracking_secret_hash || ! hash_equals($report->tracking_secret_hash, hash('sha256', $request->input('tracking_secret'))), 404);

        return response()->json(['data' => $this->citizenReport($report)]);
    }

    public function update(UpdateReportRequest $request, Report $report): JsonResponse
    {
        $validated = $request->validated();
        $staffNote = trim($validated['staff_note'] ?? '');
        $authorId = $request->user()->id;

        DB::transaction(function () use ($report, $validated, $staffNote, $authorId): void {
            $report->refresh();
            $previousStatus = $report->status;
            $nextStatus = $validated['status'];
            $report->update(['status' => $nextStatus]);

            if ($nextStatus !== $previousStatus) {
                $report->history()->create([
                    'author_id' => $authorId,
                    'from_status' => $previousStatus,
                    'to_status' => $nextStatus,
                    'occurred_at' => now(),
                    'rejection_reason' => $nextStatus === 'rejected' ? trim($validated['rejection_reason']) : null,
                    'note' => $staffNote !== '' ? $staffNote : null,
                ]);
            }

            if ($staffNote !== '') {
                $report->staffNotes()->create(['author_id' => $authorId, 'note' => $staffNote]);
            }
        });

        $report->load(['municipalService', 'evidence', 'history.author', 'staffNotes.author', 'assignmentHistory.author', 'urgencyHistory.author']);

        return response()->json(ReportResource::make($report)->resolve());
    }

    public function setUrgency(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate([
            'urgency' => ['required', 'string', 'in:critical,high,normal'],
            'rationale' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($request, $report, $validated): void {
            $previous = $report->urgency;
            $report->update(['urgency' => $validated['urgency']]);
            if ($previous !== $validated['urgency']) {
                $report->urgencyHistory()->create([
                    'author_id' => $request->user()->id,
                    'from_urgency' => $previous,
                    'to_urgency' => $validated['urgency'],
                    'rationale' => $validated['rationale'] ?? null,
                    'occurred_at' => now(),
                ]);
            }
        });

        return response()->json(['data' => ['reference' => $report->reference, 'urgency' => $report->fresh()->urgency]]);
    }

    public function assign(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate([
            'municipal_service_id' => ['required', 'integer', 'exists:municipal_services,id'],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($request, $report, $validated): void {
            $previousServiceId = $report->municipal_service_id;
            $report->update(['municipal_service_id' => $validated['municipal_service_id']]);
            $report->assignmentHistory()->create([
                'from_service_id' => $previousServiceId,
                'to_service_id' => $validated['municipal_service_id'],
                'author_id' => $request->user()->id,
                'reason' => $validated['reason'] ?? null,
                'occurred_at' => now(),
            ]);
        });

        return response()->json(['data' => ['reference' => $report->reference, 'municipal_service_id' => $report->fresh()->municipal_service_id]]);
    }

    public function addNote(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate(['note' => ['required', 'string', 'max:2000']]);
        $note = $report->staffNotes()->create(['author_id' => $request->user()->id, 'note' => trim($validated['note'])]);

        return response()->json(['data' => ['note' => $note->note, 'author' => $request->user()->name, 'created_at' => $note->created_at->toIso8601String()]], 201);
    }

    public function evidence(Report $report, int $evidence): mixed
    {
        $item = $report->evidence()->findOrFail($evidence);

        return Storage::disk($item->storage_disk)->download($item->storage_path, $item->original_name);
    }

    private function citizenReport(Report $report): array
    {
        return [
            'reference' => $report->reference,
            'title' => $report->title,
            'description' => $report->description,
            'category' => $report->category,
            'status' => $report->status,
            'urgency' => $report->urgency,
            'location' => $report->location,
            'coordinates' => $report->latitude !== null && $report->longitude !== null ? [(float) $report->latitude, (float) $report->longitude] : null,
            'submitted_at' => $report->submitted_at->toIso8601String(),
        ];
    }

    private function newReference(): string
    {
        do {
            $reference = 'HC-'.now()->format('Y').'-'.strtoupper(Str::random(6));
        } while (Report::query()->where('reference', $reference)->exists());

        return $reference;
    }
}

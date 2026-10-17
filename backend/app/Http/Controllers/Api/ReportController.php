<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(): JsonResponse
    {
        $reports = Report::query()
            ->with(['municipalService', 'evidence', 'history', 'staffNotes'])
            ->orderByDesc('submitted_at')
            ->get();

        return response()->json(ReportResource::collection($reports)->resolve());
    }

    public function show(Report $report): JsonResponse
    {
        $report->load(['municipalService', 'evidence', 'history', 'staffNotes']);

        return response()->json(ReportResource::make($report)->resolve());
    }

    public function update(UpdateReportRequest $request, Report $report): JsonResponse
    {
        $validated = $request->validated();
        $staffNote = trim($validated['staff_note'] ?? '');

        DB::transaction(function () use ($report, $validated, $staffNote): void {
            $report->refresh();
            $previousStatus = $report->status;
            $nextStatus = $validated['status'];
            $report->update(['status' => $nextStatus]);

            if ($nextStatus !== $previousStatus) {
                $report->history()->create([
                    'from_status' => $previousStatus,
                    'to_status' => $nextStatus,
                    'occurred_at' => now(),
                    'rejection_reason' => $nextStatus === 'rejected'
                        ? trim($validated['rejection_reason'])
                        : null,
                    'note' => $staffNote !== '' ? $staffNote : null,
                ]);
            }

            if ($staffNote !== '') {
                $report->staffNotes()->create(['note' => $staffNote]);
            }
        });

        $report->load(['municipalService', 'evidence', 'history', 'staffNotes']);

        return response()->json(ReportResource::make($report)->resolve());
    }
}

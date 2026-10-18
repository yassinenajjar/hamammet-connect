<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CitizenIdea;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CitizenIdeaController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        $ideas = CitizenIdea::query()->where('user_id', $request->user()->id)->latest()->get();

        return response()->json(['data' => $ideas->map(fn (CitizenIdea $idea): array => $this->toArray($idea))]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'citizen', 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $idea = CitizenIdea::query()->create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json(['data' => $this->toArray($idea->load('author'))], 201);
    }

    public function index(): JsonResponse
    {
        $ideas = CitizenIdea::query()->with('author:id,name,email')->latest()->paginate(30);

        return response()->json([
            'data' => $ideas->getCollection()->map(fn (CitizenIdea $idea): array => $this->toArray($idea)),
            'meta' => ['current_page' => $ideas->currentPage(), 'last_page' => $ideas->lastPage(), 'total' => $ideas->total()],
        ]);
    }

    public function review(Request $request, CitizenIdea $idea): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:accepted,rejected'],
            'admin_response' => ['required_if:status,rejected', 'nullable', 'string', 'max:2000'],
        ]);

        $idea->update([
            'status' => $validated['status'],
            'admin_response' => trim($validated['admin_response'] ?? '') ?: null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['data' => $this->toArray($idea->load('author'))]);
    }

    private function toArray(CitizenIdea $idea): array
    {
        return [
            'id' => $idea->id,
            'title' => $idea->title,
            'description' => $idea->description,
            'status' => $idea->status,
            'admin_response' => $idea->admin_response,
            'author_name' => $idea->author?->name,
            'author_email' => $idea->author?->email,
            'created_at' => $idea->created_at?->toIso8601String(),
            'reviewed_at' => $idea->reviewed_at?->toIso8601String(),
        ];
    }
}

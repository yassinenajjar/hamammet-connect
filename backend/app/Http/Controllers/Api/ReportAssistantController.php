<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportAssistantRequest;
use App\Services\GeminiRequestException;
use App\Services\ReportAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class ReportAssistantController extends Controller
{
    public function respond(ReportAssistantRequest $request, ReportAssistantService $assistant): JsonResponse
    {
        if (! config('services.gemini.api_key')) {
            return response()->json(['message' => 'L’assistant IA n’est pas configuré côté serveur.'], 503);
        }

        try {
            return response()->json(['data' => $assistant->respond($request->validated('messages'))]);
        } catch (Throwable $exception) {
            Log::warning('Report assistant request failed.', [
                'exception' => $exception::class,
                'gemini_upstream_status' => $exception instanceof GeminiRequestException ? $exception->upstreamStatus : null,
                'model' => config('services.gemini.model'),
            ]);

            if ($exception instanceof GeminiRequestException && in_array($exception->upstreamStatus, [401, 403], true)) {
                $message = 'La connexion de l’assistant IA est refusée. Contacte l’administration pour vérifier sa configuration Gemini.';
            } elseif ($exception instanceof RuntimeException && str_starts_with($exception->getMessage(), 'Aucune catégorie')) {
                $message = 'Aucune catégorie de signalement n’est disponible.';
            } else {
                $message = 'L’assistant est momentanément indisponible. Ton message a été conservé, réessaie dans un instant.';
            }

            return response()->json(['message' => $message], 503);
        }
    }
}

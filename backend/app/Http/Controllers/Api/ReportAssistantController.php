<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportAssistantRequest;
use App\Services\GeminiRequestException;
use App\Services\ReportAssistantService;
use Illuminate\Http\Client\ConnectionException;
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
            $context = [
                'exception' => $exception::class,
                'gemini_upstream_status' => $exception instanceof GeminiRequestException ? $exception->upstreamStatus : null,
                'model' => config('services.gemini.model'),
            ];

            if ($exception instanceof ConnectionException) {
                $context['connection_error'] = mb_substr(preg_replace('/[\r\n]+/', ' ', $exception->getMessage()) ?? '', 0, 240);
            }

            Log::warning('Report assistant request failed.', $context);

            if ($exception instanceof GeminiRequestException && in_array($exception->upstreamStatus, [401, 403], true)) {
                $message = 'La connexion de l’assistant IA est refusée. Contacte l’administration pour vérifier sa configuration Gemini.';
            } elseif ($exception instanceof GeminiRequestException && $exception->upstreamStatus === 429) {
                $message = 'La limite de requêtes Gemini est atteinte. Vérifie le quota de l’API ou réessaie plus tard.';
            } elseif ($exception instanceof ConnectionException) {
                $message = 'Le serveur n’a pas pu terminer sa requête vers Gemini. Réessaie ; si le problème continue, vérifie le détail de connexion dans le journal Laravel.';
            } elseif ($exception instanceof GeminiRequestException && $exception->upstreamStatus >= 500) {
                $message = 'Gemini est temporairement indisponible. Ton message a été conservé, réessaie dans un instant.';
            } elseif ($exception instanceof RuntimeException && str_starts_with($exception->getMessage(), 'Aucune catégorie')) {
                $message = 'Aucune catégorie de signalement n’est disponible.';
            } else {
                $message = 'L’assistant est momentanément indisponible. Ton message a été conservé, réessaie dans un instant.';
            }

            return response()->json(['message' => $message], 503);
        }
    }
}

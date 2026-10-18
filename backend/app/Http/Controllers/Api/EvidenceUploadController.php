<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CloudinaryEvidenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class EvidenceUploadController extends Controller
{
    public function signature(Request $request, CloudinaryEvidenceService $cloudinary): JsonResponse
    {
        $validated = $request->validate([
            'original_name' => ['required', 'string', 'max:255'],
            'mime_type' => ['required', 'string', Rule::in([
                'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm',
            ])],
            'size' => ['required', 'integer', 'min:1', 'max:'.CloudinaryEvidenceService::MAX_FILE_BYTES],
        ]);

        try {
            return response()->json(['data' => $cloudinary->createUploadAuthorization(
                $validated['original_name'],
                $validated['mime_type'],
                (int) $validated['size'],
            )]);
        } catch (RuntimeException $exception) {
            $status = str_contains($exception->getMessage(), 'n’est pas configuré') || str_contains($exception->getMessage(), 'n’est pas configurée') ? 503 : 422;

            return response()->json(['message' => $exception->getMessage()], $status);
        }
    }
}

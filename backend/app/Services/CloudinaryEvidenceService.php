<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class CloudinaryEvidenceService
{
    public const MAX_FILE_BYTES = 20 * 1024 * 1024;

    /** @var array<string, array{resource_type: string, format: string}> */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg' => ['resource_type' => 'image', 'format' => 'jpg'],
        'image/png' => ['resource_type' => 'image', 'format' => 'png'],
        'image/webp' => ['resource_type' => 'image', 'format' => 'webp'],
        'video/mp4' => ['resource_type' => 'video', 'format' => 'mp4'],
        'video/quicktime' => ['resource_type' => 'video', 'format' => 'mov'],
        'video/webm' => ['resource_type' => 'video', 'format' => 'webm'],
    ];

    public function isConfigured(): bool
    {
        return filled(config('services.cloudinary.cloud_name'))
            && filled(config('services.cloudinary.api_key'))
            && filled(config('services.cloudinary.api_secret'));
    }

    /** @return array<string, mixed> */
    public function createUploadAuthorization(string $originalName, string $mimeType, int $size): array
    {
        $this->ensureConfigured();
        $format = self::ALLOWED_MIME_TYPES[$mimeType] ?? null;
        if ($format === null || $size < 1 || $size > self::MAX_FILE_BYTES) {
            throw new RuntimeException('Ce fichier ne respecte pas les formats ou la taille autorisés.');
        }

        $timestamp = now()->timestamp;
        $publicId = 'hammamet-reports/'.Str::uuid()->toString();
        $parameters = [
            'allowed_formats' => 'jpg,jpeg,png,webp,mp4,mov,webm',
            'overwrite' => 'false',
            'public_id' => $publicId,
            'timestamp' => $timestamp,
            'type' => 'authenticated',
        ];
        $signature = $this->uploadSignature($parameters);
        $expiresAt = now()->addMinutes(20)->timestamp;
        $ticketPayload = [
            'public_id' => $publicId,
            'resource_type' => $format['resource_type'],
            'format' => $format['format'],
            'mime_type' => $mimeType,
            'size' => $size,
            'original_name' => mb_substr($originalName, 0, 255),
            'expires_at' => $expiresAt,
        ];
        $ticketJson = json_encode($ticketPayload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $ticketBody = $this->base64UrlEncode($ticketJson);
        $ticket = $ticketBody.'.'.$this->base64UrlEncode(hash_hmac('sha256', $ticketBody, (string) config('app.key'), true));

        return [
            'cloud_name' => config('services.cloudinary.cloud_name'),
            'api_key' => config('services.cloudinary.api_key'),
            'resource_type' => $format['resource_type'],
            'upload_url' => sprintf('https://api.cloudinary.com/v1_1/%s/%s/upload', rawurlencode((string) config('services.cloudinary.cloud_name')), $format['resource_type']),
            'parameters' => $parameters,
            'signature' => $signature,
            'ticket' => $ticket,
        ];
    }

    /** @return array{storage_path: string, storage_resource_type: string, storage_format: string, storage_version: int, original_name: string, mime_type: string, size: int} */
    public function verifyTicketAndAsset(string $ticket): array
    {
        $this->ensureConfigured();
        $parts = explode('.', $ticket);
        if (count($parts) !== 2) {
            throw new RuntimeException('Autorisation Cloudinary invalide.');
        }
        [$body, $signature] = $parts;
        $expectedSignature = $this->base64UrlEncode(hash_hmac('sha256', $body, (string) config('app.key'), true));
        if (! hash_equals($expectedSignature, $signature)) {
            throw new RuntimeException('Autorisation Cloudinary invalide.');
        }

        $payload = json_decode($this->base64UrlDecode($body), true);
        if (! is_array($payload) || ($payload['expires_at'] ?? 0) < now()->timestamp) {
            throw new RuntimeException('L’autorisation d’envoi a expiré. Réessaie l’envoi du fichier.');
        }
        if (! isset($payload['public_id'], $payload['resource_type'], $payload['format'], $payload['mime_type'], $payload['size'], $payload['original_name'])) {
            throw new RuntimeException('Autorisation Cloudinary invalide.');
        }

        $resourceType = $payload['resource_type'];
        $publicId = $payload['public_id'];
        if (! in_array($resourceType, ['image', 'video'], true) || ! str_starts_with($publicId, 'hammamet-reports/')) {
            throw new RuntimeException('Autorisation Cloudinary invalide.');
        }

        try {
            $response = Http::withBasicAuth((string) config('services.cloudinary.api_key'), (string) config('services.cloudinary.api_secret'))
                ->acceptJson()
                ->timeout(10)
                ->get(sprintf(
                    'https://api.cloudinary.com/v1_1/%s/resources/%s/authenticated/%s',
                    rawurlencode((string) config('services.cloudinary.cloud_name')),
                    $resourceType,
                    implode('/', array_map('rawurlencode', explode('/', $publicId))),
                ));
        } catch (ConnectionException $exception) {
            throw new RuntimeException('Cloudinary ne répond pas. Réessaie dans un instant.', previous: $exception);
        }

        if (! $response->successful()) {
            throw new RuntimeException($response->status() === 404
                ? 'Le fichier autorisé est introuvable sur Cloudinary.'
                : 'Cloudinary n’a pas pu vérifier le fichier. Réessaie dans un instant.');
        }

        $asset = $response->json();
        if (($asset['public_id'] ?? null) !== $publicId
            || ($asset['resource_type'] ?? null) !== $resourceType
            || ($asset['type'] ?? null) !== 'authenticated'
            || ($asset['format'] ?? null) !== $payload['format']
            || (int) ($asset['bytes'] ?? 0) !== (int) $payload['size']
            || (int) ($asset['bytes'] ?? 0) > self::MAX_FILE_BYTES
            || (int) ($asset['version'] ?? 0) < 1) {
            throw new RuntimeException('Les informations du fichier reçu ne correspondent pas à l’autorisation.');
        }

        return [
            'storage_path' => $publicId,
            'storage_resource_type' => $resourceType,
            'storage_format' => $payload['format'],
            'storage_version' => (int) ($asset['version'] ?? 0),
            'original_name' => $payload['original_name'],
            'mime_type' => $payload['mime_type'],
            'size' => (int) $asset['bytes'],
        ];
    }

    public function authenticatedDeliveryUrl(string $publicId, string $resourceType, string $format, int $version): string
    {
        if (! in_array($resourceType, ['image', 'video'], true)
            || ! str_starts_with($publicId, 'hammamet-reports/')
            || ! preg_match('/\A[a-z0-9]+\z/i', $format)
            || $version < 1) {
            throw new RuntimeException('Type de fichier Cloudinary invalide.');
        }
        $versionPart = 'v'.$version;
        $assetPath = $versionPart.'/'.$publicId.'.'.$format;
        $digest = base64_encode(sha1($assetPath.(string) config('services.cloudinary.api_secret'), true));
        $urlSignature = substr(strtr(rtrim($digest, '='), '+/', '-_'), 0, 8);

        return sprintf(
            'https://res.cloudinary.com/%s/%s/authenticated/s--%s--/%s',
            rawurlencode((string) config('services.cloudinary.cloud_name')),
            $resourceType,
            $urlSignature,
            implode('/', array_map('rawurlencode', explode('/', $assetPath))),
        );
    }

    /** @param array<string, int|string> $parameters */
    private function uploadSignature(array $parameters): string
    {
        ksort($parameters);
        $toSign = collect($parameters)->map(fn (int|string $value, string $key): string => $key.'='.$value)->implode('&');

        return sha1($toSign.(string) config('services.cloudinary.api_secret'));
    }

    private function ensureConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Le stockage Cloudinary n’est pas configuré côté serveur.');
        }
        if (! filled(config('app.key'))) {
            throw new RuntimeException('La clé de chiffrement de l’application n’est pas configurée.');
        }
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return (string) base64_decode(strtr($value, '-_', '+/'));
    }
}

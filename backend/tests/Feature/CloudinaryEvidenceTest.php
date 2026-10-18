<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Evidence;
use App\Models\Report;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class CloudinaryEvidenceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('app.key', 'test-cloudinary-signing-key');
        config()->set('services.cloudinary.cloud_name', 'test-cloud');
        config()->set('services.cloudinary.api_key', 'test-api-key');
        config()->set('services.cloudinary.api_secret', 'test-api-secret');
    }

    public function test_vite_fallback_port_is_allowed_for_local_cors_preflight(): void
    {
        // APP_ENV=local enables this same narrow loopback pattern in cors.php.
        config()->set('cors.allowed_origins_patterns', ['#^http://(localhost|127\\.0\\.0\\.1):517[0-9]+$#']);

        $this->call('OPTIONS', '/api/public/statistics', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:5174',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ])->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5174');
    }

    public function test_upload_signature_is_server_generated_and_never_contains_the_api_secret(): void
    {
        $response = $this->postJson('/api/evidence/uploads/signature', [
            'original_name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 1234,
        ])->assertOk();

        $data = $response->json('data');
        $this->assertSame('test-cloud', $data['cloud_name']);
        $this->assertSame('image', $data['resource_type']);
        $this->assertSame('authenticated', $data['parameters']['type']);
        $this->assertStringStartsWith('https://api.cloudinary.com/', $data['upload_url']);
        $this->assertNotSame('test-api-secret', $data['signature']);
        $this->assertNotSame('test-api-secret', $data['ticket']);
    }

    public function test_upload_authorization_rejects_disallowed_types_and_oversized_files(): void
    {
        $this->postJson('/api/evidence/uploads/signature', [
            'original_name' => 'script.svg',
            'mime_type' => 'image/svg+xml',
            'size' => 1024,
        ])->assertUnprocessable()->assertJsonValidationErrors('mime_type');

        $this->postJson('/api/evidence/uploads/signature', [
            'original_name' => 'large.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 20 * 1024 * 1024 + 1,
        ])->assertUnprocessable()->assertJsonValidationErrors('size');
    }

    public function test_anonymous_report_saves_only_a_cloudinary_asset_verified_by_the_server(): void
    {
        $category = Category::query()->where('active', true)->firstOrFail();
        $authorization = $this->postJson('/api/evidence/uploads/signature', [
            'original_name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 1234,
        ])->assertOk()->json('data');
        $publicId = $authorization['parameters']['public_id'];

        Http::fake(['api.cloudinary.com/*' => Http::response([
            'public_id' => $publicId,
            'resource_type' => 'image',
            'type' => 'authenticated',
            'format' => 'jpg',
            'bytes' => 1234,
            'version' => 1234567890,
        ])]);

        $reportResponse = $this->postJson('/api/reports', [
            'title' => 'Éclairage public défectueux',
            'description' => 'Un lampadaire ne fonctionne plus rue de la Corniche.',
            'category' => $category->name,
            'location' => 'Rue de la Corniche',
            'evidence' => [['ticket' => $authorization['ticket']]],
        ])->assertCreated();

        $this->assertDatabaseHas('reports', ['title' => 'Éclairage public défectueux', 'reporter_id' => null]);
        $evidence = Evidence::query()->sole();
        $this->assertSame('cloudinary', $evidence->storage_disk);
        $this->assertSame('image/jpeg', $evidence->mime_type);
        $this->assertSame(1234, $evidence->size);
        $this->assertSame($publicId, $evidence->storage_path);
        $this->assertSame('image', $evidence->storage_resource_type);
        $this->assertSame('jpg', $evidence->storage_format);
        $this->assertSame(1234567890, $evidence->storage_version);
        Http::assertSentCount(1);

        $report = Report::query()->where('reference', $reportResponse->json('data.reference'))->firstOrFail();
        $signedUrl = URL::temporarySignedRoute('reports.evidence', now()->addMinutes(5), [
            'report' => $report->reference,
            'evidence' => $evidence->id,
        ]);
        $this->get($signedUrl)
            ->assertRedirect()
            ->assertRedirectContains('/image/authenticated/s--');
    }

    public function test_cloudinary_verification_failure_does_not_create_a_report(): void
    {
        $category = Category::query()->where('active', true)->firstOrFail();
        $authorization = $this->postJson('/api/evidence/uploads/signature', [
            'original_name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 1234,
        ])->assertOk()->json('data');

        Http::fake(['api.cloudinary.com/*' => Http::response(['error' => ['message' => 'Unavailable']], 503)]);

        $this->postJson('/api/reports', [
            'title' => 'Éclairage public défectueux',
            'description' => 'Un lampadaire ne fonctionne plus rue de la Corniche.',
            'category' => $category->name,
            'location' => 'Rue de la Corniche',
            'evidence' => [['ticket' => $authorization['ticket']]],
        ])->assertStatus(503);

        $this->assertSame(0, Report::query()->count());
    }

    public function test_report_rejects_tampered_upload_tickets_and_more_than_five_attachments(): void
    {
        $category = Category::query()->where('active', true)->firstOrFail();
        $authorization = $this->postJson('/api/evidence/uploads/signature', [
            'original_name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 1234,
        ])->assertOk()->json('data');
        Http::preventStrayRequests();

        $this->postJson('/api/reports', [
            'title' => 'Éclairage public défectueux',
            'description' => 'Un lampadaire ne fonctionne plus rue de la Corniche.',
            'category' => $category->name,
            'location' => 'Rue de la Corniche',
            'evidence' => [['ticket' => $authorization['ticket'].'x']],
        ])->assertUnprocessable()->assertJsonPath('message', 'Autorisation Cloudinary invalide.');

        $sixFiles = array_fill(0, 6, ['ticket' => $authorization['ticket']]);
        $this->postJson('/api/reports', [
            'title' => 'Éclairage public défectueux',
            'description' => 'Un lampadaire ne fonctionne plus rue de la Corniche.',
            'category' => $category->name,
            'location' => 'Rue de la Corniche',
            'evidence' => $sixFiles,
        ])->assertUnprocessable()->assertJsonValidationErrors('evidence');

        $this->assertSame(0, Report::query()->count());
        Http::assertNothingSent();
    }

    public function test_cloudinary_must_be_configured_before_a_signature_is_issued(): void
    {
        config()->set('services.cloudinary.api_secret', null);

        $this->postJson('/api/evidence/uploads/signature', [
            'original_name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 1234,
        ])->assertStatus(503)->assertJsonPath('message', 'Le stockage Cloudinary n’est pas configuré côté serveur.');
    }
}

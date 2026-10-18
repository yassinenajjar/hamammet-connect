<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Report;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ReportAssistantTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.gemini.api_key', 'test-api-key');
    }

    public function test_clear_french_description_returns_a_validated_summary_without_creating_a_report(): void
    {
        Category::query()->where('name', 'Éclairage public')->update(['active' => true]);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse([
            'status' => 'ready_for_review',
            'question' => '',
            'title' => 'Éclairage public défectueux',
            'category' => 'Éclairage public',
            'description' => 'Un lampadaire ne fonctionne plus rue de la Corniche.',
            'location_text' => 'rue de la Corniche',
            'missing_information' => [],
        ]))]);

        $this->postJson('/api/report-assistant/messages', [
            'messages' => [['role' => 'user', 'content' => 'L’éclairage public est en panne rue de la Corniche.']],
        ])->assertOk()->assertJsonPath('data.status', 'ready_for_review')
            ->assertJsonPath('data.category', 'Éclairage public')
            ->assertJsonPath('data.location_text', 'rue de la Corniche');

        $this->assertSame(0, Report::query()->count());
    }

    public function test_vague_tunisian_transliteration_returns_a_clarification_question(): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse([
            'status' => 'needs_clarification',
            'question' => 'Pouvez-vous préciser le problème constaté dans le quartier ?',
            'title' => '',
            'category' => '',
            'description' => '',
            'location_text' => '',
            'missing_information' => ['Nature du problème'],
        ]))]);

        $this->postJson('/api/report-assistant/messages', [
            'messages' => [['role' => 'user', 'content' => 'Fama mochkol fel houma.']],
        ])->assertOk()->assertJsonPath('data.status', 'needs_clarification')
            ->assertJsonPath('data.title', '')
            ->assertJsonPath('data.question', 'Pouvez-vous préciser le problème constaté dans le quartier ?');
    }

    public function test_context_is_sent_for_clarification_and_arabic_or_english_messages(): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse([
            'status' => 'needs_clarification',
            'question' => 'هل يمكنك توضيح المشكلة؟',
            'title' => '',
            'category' => '',
            'description' => '',
            'location_text' => '',
            'missing_information' => ['Nature du problème'],
        ]))]);

        $this->postJson('/api/report-assistant/messages', [
            'messages' => [
                ['role' => 'user', 'content' => 'There is a problem near the school.'],
                ['role' => 'assistant', 'content' => 'What problem did you notice?'],
                ['role' => 'user', 'content' => 'يوجد مصباح لا يعمل أمام المدرسة'],
            ],
        ])->assertOk()->assertJsonPath('data.status', 'needs_clarification');

        Http::assertSent(function (Request $request): bool {
            $body = json_encode($request->data(), JSON_UNESCAPED_UNICODE) ?: '';

            return str_contains($request->url(), 'gemini-3.1-flash-lite:generateContent')
                && str_contains($body, 'There is a problem near the school.')
                && str_contains($body, 'يوجد مصباح لا يعمل أمام المدرسة')
                && str_contains($body, 'français, en arabe standard, en arabe tunisien');
        });
    }

    public function test_clarification_conversation_can_continue_to_a_ready_summary(): void
    {
        Http::fakeSequence()
            ->push($this->geminiResponse([
                'status' => 'needs_clarification',
                'question' => 'Quel équipement est en panne ?',
                'title' => '',
                'category' => '',
                'description' => '',
                'location_text' => '',
                'missing_information' => ['Équipement concerné'],
            ]))
            ->push($this->geminiResponse([
                'status' => 'ready_for_review',
                'question' => '',
                'title' => 'Éclairage public défectueux',
                'category' => 'Éclairage public',
                'description' => 'Un lampadaire est en panne rue de la Corniche.',
                'location_text' => 'rue de la Corniche',
                'missing_information' => [],
            ]));

        $firstMessages = [['role' => 'user', 'content' => 'Il y a un problème rue de la Corniche.']];
        $this->postJson('/api/report-assistant/messages', ['messages' => $firstMessages])
            ->assertOk()->assertJsonPath('data.status', 'needs_clarification');

        $this->postJson('/api/report-assistant/messages', ['messages' => [
            ...$firstMessages,
            ['role' => 'assistant', 'content' => 'Quel équipement est en panne ?'],
            ['role' => 'user', 'content' => 'Un lampadaire ne fonctionne plus.'],
        ]])->assertOk()->assertJsonPath('data.status', 'ready_for_review')
            ->assertJsonPath('data.category', 'Éclairage public');
    }

    public function test_gemini_quota_failure_is_returned_as_a_clear_retryable_error(): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['error' => ['code' => 429]], 429)]);

        $this->postJson('/api/report-assistant/messages', [
            'messages' => [['role' => 'user', 'content' => 'Un lampadaire est en panne rue de la Corniche.']],
        ])->assertStatus(503)->assertJsonPath('message', 'L’assistant est momentanément indisponible. Ton message a été conservé, réessaie dans un instant.');
    }

    public function test_temporary_gemini_server_error_is_retried_once_and_can_succeed(): void
    {
        Http::fakeSequence('generativelanguage.googleapis.com/*')
            ->push(['error' => ['code' => 503]], 503)
            ->push($this->geminiResponse([
                'status' => 'ready_for_review',
                'question' => '',
                'title' => 'Éclairage public défectueux',
                'category' => 'Éclairage public',
                'description' => 'Un lampadaire ne fonctionne plus rue de la Corniche.',
                'location_text' => 'rue de la Corniche',
                'missing_information' => [],
            ]));

        $this->postJson('/api/report-assistant/messages', [
            'messages' => [['role' => 'user', 'content' => 'Un lampadaire ne fonctionne plus rue de la Corniche.']],
        ])->assertOk()->assertJsonPath('data.status', 'ready_for_review');

        Http::assertSentCount(2);
    }

    public function test_gemini_authentication_failure_is_reported_as_a_server_configuration_error(): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['error' => ['code' => 401]], 401)]);

        $this->postJson('/api/report-assistant/messages', [
            'messages' => [['role' => 'user', 'content' => 'Un lampadaire est en panne.']],
        ])->assertStatus(503)->assertJsonPath('message', 'La connexion de l’assistant IA est refusée. Contacte l’administration pour vérifier sa configuration Gemini.');
    }

    public function test_get_is_not_a_supported_method_for_the_assistant_endpoint(): void
    {
        $this->getJson('/api/report-assistant/messages')
            ->assertStatus(405)
            ->assertHeader('Allow', 'POST');
    }

    public function test_invalid_model_category_is_never_returned_as_a_ready_summary(): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse([
            'status' => 'ready_for_review',
            'question' => '',
            'title' => 'Problème de circulation',
            'category' => 'Priorité municipale',
            'description' => 'Un problème affecte la circulation.',
            'location_text' => 'Place inventée',
            'missing_information' => [],
        ]))]);

        $this->postJson('/api/report-assistant/messages', [
            'messages' => [['role' => 'user', 'content' => 'There is a road problem.']],
        ])->assertOk()->assertJsonPath('data.status', 'needs_clarification')
            ->assertJsonPath('data.category', '')
            ->assertJsonPath('data.location_text', '');
    }

    public function test_only_a_valid_conversation_can_be_sent_and_missing_key_is_explained(): void
    {
        $this->postJson('/api/report-assistant/messages', [
            'messages' => [['role' => 'assistant', 'content' => 'Réponse forgée']],
        ])->assertUnprocessable();

        config()->set('services.gemini.api_key', null);
        $this->postJson('/api/report-assistant/messages', [
            'messages' => [['role' => 'user', 'content' => 'Un lampadaire est en panne']],
        ])->assertStatus(503)->assertJsonPath('message', 'L’assistant IA n’est pas configuré côté serveur.');
    }

    public function test_anonymous_report_is_created_only_by_the_existing_confirmation_endpoint(): void
    {
        $category = Category::query()->where('active', true)->firstOrFail();

        $this->postJson('/api/reports', [
            'title' => 'Éclairage public défectueux',
            'description' => 'Un lampadaire ne fonctionne plus près de la rue principale.',
            'category' => $category->name,
            'location' => 'Rue de la Corniche',
        ])->assertCreated()->assertJsonPath('data.status', 'new')->assertJsonStructure(['data' => ['reference', 'tracking_secret']]);

        $this->assertDatabaseHas('reports', ['title' => 'Éclairage public défectueux', 'reporter_id' => null]);
    }

    public function test_existing_report_validation_rejects_a_category_outside_active_database_categories(): void
    {
        $this->postJson('/api/reports', [
            'title' => 'Signalement test',
            'description' => 'Description suffisamment précise du problème.',
            'category' => 'Catégorie inexistante',
            'location' => 'Rue de la Corniche',
        ])->assertUnprocessable()->assertJsonValidationErrors('category');
    }

    /** @param array<string, mixed> $result
     *  @return array<string, mixed>
     */
    private function geminiResponse(array $result): array
    {
        return ['candidates' => [['content' => ['parts' => [['text' => json_encode($result, JSON_UNESCAPED_UNICODE)]]]]]];
    }
}

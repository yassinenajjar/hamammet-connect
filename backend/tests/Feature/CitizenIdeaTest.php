<?php

namespace Tests\Feature;

use App\Models\CitizenIdea;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CitizenIdeaTest extends TestCase
{
    use RefreshDatabase;

    public function test_citizen_can_submit_an_idea_and_municipal_staff_can_review_it(): void
    {
        $citizen = User::factory()->create(['role' => 'citizen']);
        $this->actingAs($citizen, 'sanctum')->postJson('/api/ideas', [
            'title' => 'Planter des arbres près de l’école',
            'description' => 'Ajouter de l’ombre dans la cour et le long du trottoir voisin.',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');

        $idea = CitizenIdea::query()->firstOrFail();
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff, 'sanctum')->getJson('/api/staff/ideas')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Planter des arbres près de l’école')
            ->assertJsonPath('data.0.author_name', $citizen->name);

        $this->patchJson('/api/staff/ideas/'.$idea->id, [
            'status' => 'rejected',
            'admin_response' => 'Le terrain proposé appartient à une école privée.',
        ])->assertOk()->assertJsonPath('data.status', 'rejected');

        $this->actingAs($citizen, 'sanctum')->getJson('/api/my/ideas')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'rejected')
            ->assertJsonPath('data.0.admin_response', 'Le terrain proposé appartient à une école privée.');
    }

    public function test_guest_cannot_submit_an_idea(): void
    {
        $this->postJson('/api/ideas', [
            'title' => 'Idée citoyenne',
            'description' => 'Une description suffisamment détaillée.',
        ])->assertUnauthorized();
    }
}

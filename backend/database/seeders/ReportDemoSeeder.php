<?php

namespace Database\Seeders;

use App\Models\MunicipalService;
use App\Models\Report;
use Illuminate\Database\Seeder;

class ReportDemoSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name' => 'Voirie & mobilité',
                'category' => 'Voirie',
                'assigned_service_name' => 'Service de la voirie',
                'key' => 'road',
                'agent_count' => 32,
                'resolution_rate' => 78,
            ],
            [
                'name' => 'Propreté urbaine',
                'category' => 'Propreté',
                'assigned_service_name' => 'Service de la propreté',
                'key' => 'clean',
                'agent_count' => 24,
                'resolution_rate' => 84,
            ],
            [
                'name' => 'Éclairage public',
                'category' => 'Éclairage public',
                'assigned_service_name' => 'Service de l’éclairage public',
                'key' => 'light',
                'agent_count' => 12,
                'resolution_rate' => 65,
            ],
            [
                'name' => 'Espaces verts',
                'category' => 'Espaces verts',
                'assigned_service_name' => 'Service des espaces verts',
                'key' => 'green',
                'agent_count' => 18,
                'resolution_rate' => 91,
            ],
            [
                'name' => 'Eau & assainissement',
                'category' => 'Eau & assainissement',
                'assigned_service_name' => 'Service des eaux et de l’assainissement',
                'key' => 'water',
                'agent_count' => 14,
                'resolution_rate' => 72,
            ],
        ];

        $serviceIds = [];

        foreach ($services as $serviceAttributes) {
            $service = MunicipalService::query()->firstOrCreate(
                ['category' => $serviceAttributes['category']],
                $serviceAttributes,
            );

            $serviceIds[$service->category] = $service->id;
        }

        $reports = [
            [
                'reference' => 'HC-2026-041',
                'title' => 'Fuite d’eau près de l’avenue de la République',
                'category' => 'Eau & assainissement',
                'urgency' => 'critical',
                'status' => 'in_progress',
                'contributions_count' => 8,
                'location' => 'Avenue de la République',
                'latitude' => 36.4004,
                'longitude' => 10.6161,
                'submitted_at' => '2026-10-17T09:00:00+01:00',
                'description' => 'Une fuite importante a été signalée près du trottoir. De l’eau s’écoule sur la chaussée depuis ce matin.',
            ],
            [
                'reference' => 'HC-2026-038',
                'title' => 'Éclairage public en panne',
                'category' => 'Éclairage public',
                'urgency' => 'high',
                'status' => 'in_progress',
                'contributions_count' => 5,
                'location' => 'Rue des Orangers',
                'latitude' => 36.4077,
                'longitude' => 10.6129,
                'submitted_at' => '2026-10-16T09:00:00+01:00',
                'description' => 'Plusieurs lampadaires ne fonctionnent plus dans la rue.',
            ],
            [
                'reference' => 'HC-2026-035',
                'title' => 'Nid-de-poule sur la chaussée',
                'category' => 'Voirie',
                'urgency' => 'normal',
                'status' => 'new',
                'contributions_count' => 3,
                'location' => 'Boulevard de l’Environnement',
                'latitude' => 36.3953,
                'longitude' => 10.6207,
                'submitted_at' => '2026-10-16T09:00:00+01:00',
                'description' => 'Un nid-de-poule gêne la circulation à proximité du marché.',
            ],
            [
                'reference' => 'HC-2026-031',
                'title' => 'Dépôt sauvage de déchets',
                'category' => 'Propreté',
                'urgency' => 'high',
                'status' => 'in_progress',
                'contributions_count' => 6,
                'location' => 'Zone touristique, Yasmine',
                'latitude' => 36.3764,
                'longitude' => 10.5411,
                'submitted_at' => '2026-10-15T09:00:00+01:00',
                'description' => 'Des déchets encombrants ont été déposés à côté des conteneurs.',
            ],
            [
                'reference' => 'HC-2026-028',
                'title' => 'Branche tombée sur le trottoir',
                'category' => 'Espaces verts',
                'urgency' => 'critical',
                'status' => 'new',
                'contributions_count' => 2,
                'location' => 'Jardin public',
                'latitude' => 36.3992,
                'longitude' => 10.614,
                'submitted_at' => '2026-10-15T09:00:00+01:00',
                'description' => 'Une grosse branche bloque le passage piéton.',
            ],
            [
                'reference' => 'HC-2026-024',
                'title' => 'Poubelle publique endommagée',
                'category' => 'Propreté',
                'urgency' => 'normal',
                'status' => 'resolved',
                'contributions_count' => 4,
                'location' => 'Place des Martyrs',
                'latitude' => 36.4,
                'longitude' => 10.6148,
                'submitted_at' => '2026-10-14T09:00:00+01:00',
                'description' => 'La poubelle a été remplacée par les services municipaux.',
            ],
            [
                'reference' => 'HC-2026-019',
                'title' => 'Signalisation à rafraîchir',
                'category' => 'Voirie',
                'urgency' => 'normal',
                'status' => 'in_progress',
                'contributions_count' => 2,
                'location' => 'Rue Mongi Slim',
                'latitude' => 36.4055,
                'longitude' => 10.6172,
                'submitted_at' => '2026-10-13T09:00:00+01:00',
                'description' => 'Le marquage du passage piéton est presque effacé.',
            ],
            [
                'reference' => 'HC-2026-015',
                'title' => 'Banc public à réparer',
                'category' => 'Espaces verts',
                'urgency' => 'normal',
                'status' => 'resolved',
                'contributions_count' => 1,
                'location' => 'Promenade de la corniche',
                'latitude' => 36.4015,
                'longitude' => 10.6088,
                'submitted_at' => '2026-10-12T09:00:00+01:00',
                'description' => 'Le banc a été réparé par l’équipe des espaces verts.',
            ],
        ];

        foreach ($reports as $reportAttributes) {
            $report = Report::query()->firstOrCreate(
                ['reference' => $reportAttributes['reference']],
                [
                    ...$reportAttributes,
                    'municipal_service_id' => $serviceIds[$reportAttributes['category']],
                ],
            );

            if ($report->history()->doesntExist()) {
                $report->history()->create([
                    'from_status' => null,
                    'to_status' => $report->status,
                    'occurred_at' => $report->submitted_at,
                    'note' => 'Réclamation enregistrée dans le jeu de démonstration.',
                ]);
            }
        }
    }
}

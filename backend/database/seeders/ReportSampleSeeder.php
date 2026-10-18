<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class ReportSampleSeeder extends Seeder
{
    /**
     * Add a repeatable set of clearly fictional citizens and reports for local/demo use.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('ReportSampleSeeder skipped in production.');

            return;
        }

        $citizens = [
            ['name' => 'Amira Ben Salem', 'email' => 'amira.bensalem@example.test'],
            ['name' => 'Youssef Trabelsi', 'email' => 'youssef.trabelsi@example.test'],
            ['name' => 'Mariam Gharbi', 'email' => 'mariam.gharbi@example.test'],
            ['name' => 'Sami Khelifi', 'email' => 'sami.khelifi@example.test'],
            ['name' => 'Nour Bouazizi', 'email' => 'nour.bouazizi@example.test'],
            ['name' => 'Ahmed Jaziri', 'email' => 'ahmed.jaziri@example.test'],
            ['name' => 'Ines Saidi', 'email' => 'ines.saidi@example.test'],
            ['name' => 'Fares Mabrouk', 'email' => 'fares.mabrouk@example.test'],
        ];

        $citizenIds = [];
        foreach ($citizens as $citizen) {
            $user = User::query()->firstOrCreate(
                ['email' => $citizen['email']],
                ['name' => $citizen['name'], 'password' => Hash::make(bin2hex(random_bytes(32))), 'role' => 'citizen'],
            );
            $citizenIds[$citizen['email']] = $user->id;
        }

        $rows = [
            ['2026-09-02 08:30:00', 'Nid-de-poule près de l’école', 'Voirie', 'Rue de la République, Hammamet', 36.4009, 10.6167, 'new', 'normal', 0],
            ['2026-09-05 17:15:00', 'Lampadaire éteint', 'Éclairage public', 'Avenue Habib Bourguiba, Hammamet', 36.3995, 10.6152, 'in_progress', 'high', 1],
            ['2026-09-09 11:00:00', 'Déchets près des conteneurs', 'Propreté', 'Rue des Orangers, Hammamet', 36.4077, 10.6129, 'new', 'normal', 2],
            ['2026-09-13 07:45:00', 'Fuite d’eau sur le trottoir', 'Eau & assainissement', 'Avenue de la République, Hammamet', 36.4004, 10.6161, 'in_progress', 'critical', 3],
            ['2026-09-18 14:20:00', 'Branche dangereuse au-dessus du passage', 'Espaces verts', 'Jardin public, Hammamet', 36.3992, 10.6140, 'resolved', 'high', 4],
            ['2026-09-22 09:10:00', 'Panneau de circulation abîmé', 'Voirie', 'Rue Mongi Slim, Hammamet', 36.4055, 10.6172, 'new', 'normal', 5],
            ['2026-09-27 19:40:00', 'Éclairage faible dans la rue', 'Éclairage public', 'Rue de Marseille, Hammamet', 36.4028, 10.6114, 'transferred', 'high', 6],
            ['2026-10-01 10:05:00', 'Poubelle publique endommagée', 'Propreté', 'Place des Martyrs, Hammamet', 36.4000, 10.6148, 'resolved', 'normal', 7],
            ['2026-10-03 16:30:00', 'Eau stagnante après la pluie', 'Eau & assainissement', 'Rue de la Corniche, Hammamet', 36.4015, 10.6088, 'new', 'normal', 0],
            ['2026-10-05 12:00:00', 'Trottoir difficilement accessible', 'Voirie', 'Avenue des Nations Unies, Hammamet', 36.3953, 10.6207, 'in_progress', 'high', 1],
            ['2026-10-07 18:25:00', 'Dépôt sauvage de gravats', 'Propreté', 'Zone touristique, Yasmine Hammamet', 36.3764, 10.5411, 'new', 'high', 2],
            ['2026-10-09 06:50:00', 'Arrosage automatique en panne', 'Espaces verts', 'Parc de Yasmine Hammamet', 36.3748, 10.5428, 'transferred', 'normal', 3],
            ['2026-10-11 13:35:00', 'Fuite près du marché', 'Eau & assainissement', 'Marché municipal, Hammamet', 36.3978, 10.6159, 'in_progress', 'critical', 4],
            ['2026-10-13 20:10:00', 'Lampadaire manquant', 'Éclairage public', 'Route de Nabeul, Hammamet', 36.4112, 10.6194, 'new', 'normal', 5],
            ['2026-10-15 08:00:00', 'Marquage piéton presque effacé', 'Voirie', 'Rue de l’Indépendance, Hammamet', 36.4032, 10.6136, 'resolved', 'normal', 6],
            ['2026-10-17 15:45:00', 'Conteneur débordant', 'Propreté', 'Hammamet Sud', 36.3893, 10.6178, 'new', 'high', 7],
        ];

        foreach ($rows as $index => [$date, $title, $categoryName, $location, $latitude, $longitude, $status, $urgency, $citizenIndex]) {
            $category = Category::query()->where('name', $categoryName)->first();
            if (! $category) {
                throw new RuntimeException("La catégorie de démonstration '{$categoryName}' n’existe pas. Exécutez ReportDemoSeeder d’abord.");
            }

            $reference = sprintf('HC-SAMPLE-2026-%03d', $index + 1);
            $report = Report::query()->firstOrNew(['reference' => $reference]);
            $hasStatusChanges = $report->exists && $report->history()->whereNotNull('from_status')->exists();
            $attributes = [
                'reporter_id' => $citizenIds[$citizens[$citizenIndex]['email']],
                'category_id' => $category->id,
                'title' => $title,
                'description' => "Donnée fictive de démonstration : {$title}. Emplacement indiqué : {$location}.",
                'category' => $category->name,
                'urgency' => $urgency,
                'contributions_count' => ($index % 5) + 1,
                'location' => $location,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'submitted_at' => $date,
                'municipal_service_id' => $category->municipal_service_id,
            ];

            // Sync seed-owned fields each time while preserving status changes made by municipal staff.
            if (! $hasStatusChanges) {
                $attributes['status'] = $status;
            }

            $report->fill($attributes)->save();

            if (! $hasStatusChanges) {
                $report->history()->updateOrCreate(
                    ['from_status' => null],
                    [
                        'to_status' => $report->status,
                        'occurred_at' => $report->submitted_at,
                        'note' => 'Signalement fictif créé pour les données de démonstration.',
                    ],
                );
            } elseif ($report->history()->doesntExist()) {
                $report->history()->create([
                    'from_status' => null,
                    'to_status' => $report->status,
                    'occurred_at' => $report->submitted_at,
                    'note' => 'Signalement fictif créé pour les données de démonstration.',
                ]);
            }
        }

        $this->command?->info('Jeu de démonstration ajouté : 16 signalements datés et 8 citoyens fictifs.');
    }
}

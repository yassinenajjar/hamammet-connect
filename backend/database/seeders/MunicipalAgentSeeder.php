<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

class MunicipalAgentSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('MunicipalAgentSeeder skipped in production. Provision staff through a trusted deployment process.');

            return;
        }

        $email = mb_strtolower(trim((string) env('MUNICIPAL_AGENT_EMAIL', 'agent@hammamet.tn')));
        $name = trim((string) env('MUNICIPAL_AGENT_NAME', 'Agent municipal'));
        $configuredPassword = (string) env('MUNICIPAL_AGENT_PASSWORD', '');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('MUNICIPAL_AGENT_EMAIL must be a valid email address.');
        }

        if ($name === '') {
            throw new RuntimeException('MUNICIPAL_AGENT_NAME must not be empty.');
        }

        $existingUser = User::query()->where('email', $email)->first();

        if ($existingUser) {
            if (! $existingUser->isStaff()) {
                throw new RuntimeException("The configured municipal agent email is already used by a non-staff account: {$email}. No role was changed.");
            }

            $this->command?->info("Municipal staff account already exists: {$email}. No password or role was changed.");

            return;
        }

        $password = $configuredPassword !== '' ? $configuredPassword : Str::random(48);

        User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => 'staff',
        ]);

        $this->command?->info("Municipal agent created: {$email}");

        if ($configuredPassword === '') {
            $this->command?->warn("One-time password (save it now): {$password}");
        } else {
            $this->command?->info('Password was taken from MUNICIPAL_AGENT_PASSWORD.');
        }
    }
}

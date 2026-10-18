<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('key')->unique();
            $table->foreignId('municipal_service_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        $categoryNames = DB::table('reports')->distinct()->pluck('category')
            ->merge(DB::table('municipal_services')->distinct()->pluck('category'))
            ->merge([
                'Propreté',
                'Éclairage public',
                'Voirie',
                'Voirie et trottoirs',
                'Eau & assainissement',
                'Eau et assainissement',
                'Espaces verts',
                'Sécurité et mobilier urbain',
                'Autre',
            ])
            ->filter()->unique();
        foreach ($categoryNames as $name) {
            $serviceCategory = match ($name) {
                'Voirie et trottoirs' => 'Voirie',
                'Eau et assainissement' => 'Eau & assainissement',
                'Sécurité et mobilier urbain', 'Autre' => null,
                default => $name,
            };
            $serviceId = $serviceCategory ? DB::table('municipal_services')->where('category', $serviceCategory)->value('id') : null;
            DB::table('categories')->insert([
                'name' => $name,
                'key' => Str::slug($name).'-'.substr(hash('sha256', $name), 0, 6),
                'municipal_service_id' => $serviceId,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->default('citizen')->index();
        });

        Schema::table('reports', function (Blueprint $table): void {
            $table->dropForeign(['municipal_service_id']);
            $table->foreignId('reporter_id')->nullable()->after('reference')->constrained('users')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->after('reporter_id')->constrained('categories')->nullOnDelete();
            $table->char('tracking_secret_hash', 64)->nullable()->unique()->after('reporter_id');
            $table->string('location')->nullable()->change();
            $table->decimal('latitude', 10, 7)->nullable()->change();
            $table->decimal('longitude', 10, 7)->nullable()->change();
            $table->foreignId('municipal_service_id')->nullable()->change();
            $table->string('urgency')->nullable()->default(null)->change();
            $table->index(['reporter_id', 'submitted_at']);
            $table->foreign('municipal_service_id')->references('id')->on('municipal_services')->nullOnDelete();
        });

        foreach (DB::table('reports')->get(['id', 'category']) as $report) {
            $categoryId = DB::table('categories')->where('name', $report->category)->value('id');
            DB::table('reports')->where('id', $report->id)->update(['category_id' => $categoryId]);
        }

        Schema::table('evidence', function (Blueprint $table): void {
            $table->foreignId('uploaded_by')->nullable()->after('report_id')->constrained('users')->nullOnDelete();
        });

        Schema::table('report_status_histories', function (Blueprint $table): void {
            $table->foreignId('author_id')->nullable()->after('report_id')->constrained('users')->nullOnDelete();
        });

        Schema::table('staff_notes', function (Blueprint $table): void {
            $table->foreignId('author_id')->nullable()->after('report_id')->constrained('users')->nullOnDelete();
        });

        Schema::create('report_assignment_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_service_id')->nullable()->constrained('municipal_services')->nullOnDelete();
            $table->foreignId('to_service_id')->nullable()->constrained('municipal_services')->nullOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['report_id', 'occurred_at']);
        });

        Schema::create('report_urgency_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('from_urgency')->nullable();
            $table->string('to_urgency');
            $table->text('rationale')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['report_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_assignment_histories');
        Schema::dropIfExists('report_urgency_histories');

        Schema::table('staff_notes', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('author_id');
        });

        Schema::table('report_status_histories', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('author_id');
        });

        Schema::table('evidence', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('uploaded_by');
        });

        Schema::table('reports', function (Blueprint $table): void {
            $table->dropForeign(['municipal_service_id']);
            $table->dropIndex(['reporter_id', 'submitted_at']);
            $table->dropUnique(['tracking_secret_hash']);
            $table->dropConstrainedForeignId('reporter_id');
            $table->dropConstrainedForeignId('category_id');
            $table->dropColumn('tracking_secret_hash');
            $table->string('location')->nullable(false)->change();
            $table->decimal('latitude', 10, 7)->nullable(false)->change();
            $table->decimal('longitude', 10, 7)->nullable(false)->change();
            $table->foreignId('municipal_service_id')->nullable(false)->change();
            $table->string('urgency')->nullable(false)->default('normal')->change();
            $table->foreign('municipal_service_id')->references('id')->on('municipal_services')->restrictOnDelete();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['role']);
            $table->dropColumn('role');
        });

        Schema::dropIfExists('categories');
    }
};

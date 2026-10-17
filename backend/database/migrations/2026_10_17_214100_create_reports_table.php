<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table): void {
            $table->id();
            $table->string('reference')->unique();
            $table->string('title');
            $table->text('description');
            $table->string('category');
            $table->string('urgency')->default('normal');
            $table->string('status')->default('new');
            $table->unsignedInteger('contributions_count')->default(1);
            $table->string('location');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamp('submitted_at');
            $table->foreignId('municipal_service_id')->constrained()->restrictOnDelete();
            $table->timestamps();

            $table->index(['status', 'submitted_at']);
            $table->index(['urgency', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};

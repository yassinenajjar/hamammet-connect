<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('municipal_services', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('category')->unique();
            $table->string('assigned_service_name');
            $table->string('key')->unique();
            $table->unsignedSmallInteger('agent_count')->default(0);
            $table->unsignedTinyInteger('resolution_rate')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('municipal_services');
    }
};

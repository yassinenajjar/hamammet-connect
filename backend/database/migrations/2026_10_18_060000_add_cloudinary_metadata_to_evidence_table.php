<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evidence', function (Blueprint $table): void {
            $table->string('storage_resource_type', 16)->nullable();
            $table->string('storage_format', 16)->nullable();
            $table->unsignedBigInteger('storage_version')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('evidence', function (Blueprint $table): void {
            $table->dropColumn(['storage_resource_type', 'storage_format', 'storage_version']);
        });
    }
};

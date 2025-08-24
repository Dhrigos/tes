<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subspesialis', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('kode');
            $table->string('kode_rujukan');
            $table->foreignId('id_spesialis')->constrained('spesialis')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subspesialis');
    }
};

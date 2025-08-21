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
        Schema::create('antrian_pasiens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pasien_id')    // Relasi ke tabel pasien
                ->constrained()
                ->onDelete('cascade');
            $table->string('prefix');         // Nomor antrian harian
            $table->integer('nomor');         // Nomor antrian harian
            $table->date('tanggal')->nullable(); // Tanggal antrian (optional, bisa gunakan created_at)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('antrian_pasiens');
    }
};

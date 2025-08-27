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
        Schema::create('perawat_pelatihans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perawat_id')->constrained('perawats')->onDelete('cascade');
            $table->string('nama_pelatihan');
            $table->string('penyelenggara')->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->string('nomor_sertifikat')->nullable();
            $table->string('file_sertifikat')->nullable();
            $table->timestamps();

            $table->index(['perawat_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perawat_pelatihans');
    }
};

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
        Schema::create('pendaftaran_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('pasien_id');
            $table->string('nomor_register');
            $table->string('register_id');
            $table->string('tanggal_kujungan');
            $table->string('status_panggil');
            $table->string('status_pendaftaran');
            $table->string('Status_aplikasi')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pendaftaran_statuses');
    }
};

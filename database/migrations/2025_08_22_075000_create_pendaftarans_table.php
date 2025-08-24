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
        Schema::create('pendaftarans', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('pasien_id');
            $table->string('nomor_register');
            $table->string('tanggal_kujungan');
            $table->string('poli_id');
            $table->string('dokter_id');
            $table->string('Penjamin');
            $table->string('antrian')->nullable();
            $table->string('no_urut')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pendaftarans');
    }
};

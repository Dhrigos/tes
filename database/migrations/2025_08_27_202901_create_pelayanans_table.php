<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pelayanans', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('pasien_id');
            $table->string('nomor_register');
            $table->date('tanggal_kujungan');
            $table->string('poli_id');
            $table->string('dokter_id');
            $table->string('kunjungan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanans');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pelayanan_soap_dokter_icds', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('seks');
            $table->string('penjamin');
            $table->date('tanggal_lahir');
            $table->string('nama_icd10')->nullable();
            $table->string('kode_icd10')->nullable();
            $table->string('priority_icd10')->nullable();
            $table->string('nama_icd9')->nullable();
            $table->string('kode_icd9')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_dokter_icds');
    }
};

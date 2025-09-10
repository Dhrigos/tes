<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_soap_konfirmasi', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm')->index();
            $table->string('nama');
            $table->string('no_rawat')->index();
            $table->string('seks')->nullable();
            $table->string('penjamin')->nullable();
            $table->string('tanggal_lahir')->nullable();
            $table->string('umur')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_konfirmasi');
    }
};



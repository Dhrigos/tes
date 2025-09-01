<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pelayanan_soap_dokter_tindakans', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('seks');
            $table->string('penjamin')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('jenis_tindakan')->nullable();
            $table->string('jenis_pelaksana')->nullable();
            $table->string('harga')->nullable();
            $table->string('status_kasir')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_dokter_tindakans');
    }
};

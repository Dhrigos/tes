<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_soap_dokter_tindakans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255);
            $table->string('nama', 255);
            $table->string('no_rawat', 255);
            $table->string('seks', 255);
            $table->string('penjamin', 255);
            $table->date('tanggal_lahir');
            $table->string('kode_tindakan', 255)->nullable();
            $table->string('jenis_tindakan', 255);
            $table->string('kategori_tindakan', 255)->nullable();
            $table->string('jenis_pelaksana', 255);
            $table->string('harga', 255);
            $table->string('status_kasir', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_dokter_tindakans');
    }
};

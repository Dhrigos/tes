<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_barang_keluar', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_request', 255);
            $table->string('nama_klinik', 255);
            $table->string('tanggal_request', 255);
            $table->string('kode_obat_alkes', 255);
            $table->string('nama_obat_alkes', 255);
            $table->string('harga_dasar', 255);
            $table->integer('qty');
            $table->string('tanggal_terima_obat', 255);
            $table->dateTime('expired')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('data_barang_keluar');
    }
};

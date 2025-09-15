<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembelian_inventaris_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode', 255);
            $table->string('kode_barang', 255);
            $table->string('nama_barang', 255);
            $table->string('kategori_barang', 255);
            $table->string('jenis_barang', 255);
            $table->string('qty_barang', 255);
            $table->string('harga_barang', 255);
            $table->string('lokasi', 255);
            $table->string('kondisi', 255);
            $table->string('masa_akhir_penggunaan', 255);
            $table->string('tanggal_pembelian', 255);
            $table->string('detail_barang', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pembelian_inventaris_details');
    }
};

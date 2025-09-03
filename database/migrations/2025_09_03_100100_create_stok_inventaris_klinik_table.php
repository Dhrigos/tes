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
        Schema::create('stok_inventaris_klinik', function (Blueprint $table) {
            $table->id();
            $table->string('kode_pembelian');
            $table->string('kode_barang');
            $table->string('nama_barang');
            $table->string('kategori_barang');
            $table->string('jenis_barang');
            $table->string('qty_barang');
            $table->string('harga_barang');
            $table->string('masa_akhir_penggunaan')->nullable();
            $table->string('tanggal_pembelian');
            $table->string('detail_barang');
            $table->string('lokasi')->nullable();
            $table->string('penanggung_jawab')->nullable();
            $table->string('kondisi')->nullable();
            $table->string('no_seri')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stok_inventaris_klinik');
    }
};

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
        Schema::create('pembelian_inventaris_details', function (Blueprint $table) {
            $table->id();
            $table->string('kode');
            $table->string('kode_barang');
            $table->string('nama_barang');
            $table->string('kategori_barang');
            $table->string('jenis_barang');
            $table->string('qty_barang');
            $table->string('harga_barang');
            $table->string('lokasi');
            $table->string('kondisi');
            $table->string('masa_akhir_penggunaan');
            $table->string('tanggal_pembelian');
            $table->string('detail_barang');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembelian_inventaris_details');
    }
};

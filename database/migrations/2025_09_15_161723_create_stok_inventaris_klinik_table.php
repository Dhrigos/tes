<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stok_inventaris_klinik', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_pembelian', 255);
            $table->string('kode_barang', 255);
            $table->string('nama_barang', 255);
            $table->string('kategori_barang', 255);
            $table->string('jenis_barang', 255);
            $table->integer('qty_barang');
            $table->string('harga_barang', 255);
            $table->string('masa_akhir_penggunaan', 255)->nullable();
            $table->string('tanggal_pembelian', 255);
            $table->string('detail_barang', 255);
            $table->string('lokasi', 255)->nullable();
            $table->string('penanggung_jawab', 255)->nullable();
            $table->string('kondisi', 255)->nullable();
            $table->string('no_seri', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('stok_inventaris_klinik');
    }
};

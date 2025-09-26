<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daftar_barang', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode', 255)->nullable();
            $table->string('nama', 255);
            $table->string('jenis_barang', 255)->nullable();
            $table->string('nama_dagang', 255)->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('jenis_inventaris', 255)->nullable();
            $table->string('satuan', 255)->nullable();
            $table->string('jenis_formularium', 255)->nullable();
            $table->string('kfa_kode', 255)->nullable();
            $table->string('nama_industri', 255)->nullable();
            $table->string('merek', 255)->nullable();
            $table->string('satuan_kecil', 255)->nullable();
            $table->integer('nilai_satuan_kecil')->nullable();
            $table->string('satuan_sedang', 255)->nullable();
            $table->integer('nilai_satuan_sedang')->nullable();
            $table->string('satuan_besar', 255)->nullable();
            $table->integer('nilai_satuan_besar')->nullable();
            $table->string('penyimpanan', 255)->nullable();
            $table->string('barcode', 255)->nullable();
            $table->unsignedBigInteger('gudang_kategori')->nullable();
            $table->string('jenis_obat', 255)->nullable();
            $table->string('jenis_generik', 255)->nullable();
            $table->string('bentuk_obat', 255)->nullable();
            $table->boolean('multi_pakai')->nullable();
            $table->integer('multi_pakai_jumlah')->nullable();
            $table->string('multi_pakai_satuan', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['kode']);
            $table->index(['gudang_kategori'], 'daftar__obats_gudang_kategori_foreign');
            $table->index(['barcode'], 'daftar__obats_barcode_index');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('daftar_barang');
    }
};

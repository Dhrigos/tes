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
        Schema::create('daftar__obats', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->nullable()->unique();
            $table->string('nama');
            $table->string('jenis_barang')->nullable(); // farmasi, alkes, inventaris
            $table->string('nama_dagang')->nullable();
            $table->text('deskripsi')->nullable(); // untuk inventaris
            $table->string('jenis_inventaris')->nullable(); // Elektronik, Non-Elektronik
            $table->string('satuan')->nullable(); // untuk inventaris
            $table->string('jenis_formularium')->nullable();
            $table->string('kfa_kode')->nullable();
            $table->string('nama_industri')->nullable();
            $table->string('merek')->nullable();
            $table->string('satuan_kecil')->nullable();
            $table->integer('nilai_satuan_kecil')->nullable();
            $table->string('satuan_sedang')->nullable();
            $table->integer('nilai_satuan_sedang')->nullable();
            $table->string('satuan_besar')->nullable();
            $table->integer('nilai_satuan_besar')->nullable();
            $table->string('penyimpanan')->nullable();
            $table->string('barcode')->nullable()->index();
            $table->unsignedBigInteger('gudang_kategori')->nullable();
            $table->string('jenis_obat')->nullable(); // Reguler, Khusus, Darurat
            $table->string('jenis_generik')->nullable(); // Non-Generic, Generic Polos, Branded Generic
            $table->string('bentuk_obat')->nullable(); // padat, cair, gas
            $table->timestamps();

            $table->foreign('gudang_kategori')
                ->references('id')
                ->on('kategori_barang')
                ->nullOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daftar__obats');
    }
};



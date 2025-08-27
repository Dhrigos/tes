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
            $table->string('nama_dagang')->nullable();
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
            $table->string('jenis_obat')->nullable();
            $table->string('jenis_generik')->nullable();
            $table->string('bentuk_obat')->nullable();
            $table->timestamps();

            $table->foreign('gudang_kategori')
                ->references('id')
                ->on('kategori__obats')
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



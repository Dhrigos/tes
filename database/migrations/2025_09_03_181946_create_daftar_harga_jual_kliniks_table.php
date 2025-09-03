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
        Schema::create('daftar_harga_jual_kliniks', function (Blueprint $table) {
            $table->id();
            $table->string('kode_obat_alkes');
            $table->string('nama_obat_alkes');
            $table->string('harga_dasar');
            $table->string('harga_jual_1')->nullable();
            $table->string('harga_jual_2')->nullable();
            $table->string('harga_jual_3')->nullable();
            $table->string('diskon');
            $table->string('ppn');
            $table->string('tanggal_obat_masuk');
            $table->string('user_input_id');
            $table->string('user_input_name');
            $table->string('jenis')->default('klinik'); // 'klinik' untuk membedakan dengan 'utama'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daftar_harga_jual_kliniks');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daftar_harga_jual_kliniks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_obat_alkes', 255);
            $table->string('nama_obat_alkes', 255);
            $table->string('harga_dasar', 255);
            $table->string('harga_jual_1', 255)->nullable();
            $table->string('harga_jual_2', 255)->nullable();
            $table->string('harga_jual_3', 255)->nullable();
            $table->string('diskon', 255);
            $table->string('ppn', 255);
            $table->string('tanggal_obat_masuk', 255);
            $table->string('jenis', 255)->default('klinik');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('daftar_harga_jual_kliniks');
    }
};

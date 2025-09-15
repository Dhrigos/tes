<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stok_obat_klinik', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_obat_alkes', 255);
            $table->string('nama_obat_alkes', 255);
            $table->string('qty', 255);
            $table->string('tanggal_terima_obat', 255);
            $table->string('expired', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('stok_obat_klinik');
    }
};

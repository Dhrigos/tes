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
        Schema::create('stok_obat_klinik', function (Blueprint $table) {
            $table->id();
            $table->string('kode_obat_alkes');
            $table->string('nama_obat_alkes');
            $table->string('qty');
            $table->string('tanggal_terima_obat');
            $table->string('expired')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stok_obat_klinik');
    }
};

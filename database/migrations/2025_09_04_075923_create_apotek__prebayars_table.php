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
        Schema::create('apotek_prebayars', function (Blueprint $table) {
            $table->id();
            $table->string('kode_faktur');
            $table->string('no_rm');
            $table->string('nama');
            $table->string('tanggal');
            $table->string('nama_obat_alkes');
            $table->string('kode_obat_alkes');
            $table->string('harga');
            $table->string('qty');
            $table->string('total');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apotek_prebayars');
    }
};

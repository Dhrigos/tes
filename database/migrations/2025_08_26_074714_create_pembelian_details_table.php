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
        Schema::create('pembelian_details', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_faktur');
            $table->string('nama_obat_alkes');
            $table->string('kode_obat_alkes');
            $table->string('qty');
            $table->string('harga_satuan');
            $table->string('diskon');
            $table->string('exp');
            $table->string('batch');
            $table->string('sub_total');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembelian_details');
    }
};

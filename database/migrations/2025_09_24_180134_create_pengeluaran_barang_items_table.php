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
        Schema::create('pengeluaran_barang_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pengeluaran_id')->index();
            $table->string('kode_obat_alkes', 100);
            $table->string('nama_obat_alkes');
            $table->string('batch', 100)->nullable();
            $table->unsignedInteger('qty');
            $table->timestamps();

            // Optional: foreign key to header (no cascade delete to preserve history)
            // $table->foreign('pengeluaran_id')->references('id')->on('pengeluaran_barang');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengeluaran_barang_items');
    }
};

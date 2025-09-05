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
        Schema::create('kasir_details', function (Blueprint $table) {
            $table->id();
            $table->string('kode_faktur');
            $table->string('no_rawat')->nullable();
            $table->string('no_rm');
            $table->string('nama_obat_tindakan')->nullable();
            $table->string('harga_obat_tindakan')->nullable();
            $table->string('pelaksana')->nullable();
            $table->string('qty')->default('1');
            $table->string('subtotal');
            $table->string('nama_diskon')->nullable();
            $table->string('harga_diskon')->nullable();
            $table->string('total');
            $table->string('tanggal');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kasir_details');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembelian_obat_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_faktur', 255);
            $table->string('nama_obat_alkes', 255);
            $table->string('kode_obat_alkes', 255);
            $table->string('qty', 255);
            $table->string('harga_satuan', 255);
            $table->string('diskon', 255);
            $table->string('exp', 255);
            $table->string('batch', 255);
            $table->string('sub_total', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pembelian_obat_details');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permintaan_barang_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_request', 255);
            $table->string('kode_obat_alkes', 255);
            $table->string('nama_obat_alkes', 255);
            $table->integer('qty');
            $table->string('jenis_barang', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('permintaan_barang_details');
    }
};

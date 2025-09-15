<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kasir_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_faktur', 255);
            $table->string('no_rawat', 255)->nullable();
            $table->string('no_rm', 255);
            $table->string('nama_obat_tindakan', 255)->nullable();
            $table->string('harga_obat_tindakan', 255)->nullable();
            $table->string('pelaksana', 255)->nullable();
            $table->string('qty', 255)->default('1');
            $table->string('subtotal', 255);
            $table->string('nama_diskon', 255)->nullable();
            $table->string('harga_diskon', 255)->nullable();
            $table->string('total', 255);
            $table->string('tanggal', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('kasir_details');
    }
};

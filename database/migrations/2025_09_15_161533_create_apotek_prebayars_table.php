<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apotek_prebayars', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_faktur', 255);
            $table->string('no_rm', 255);
            $table->string('nama', 255);
            $table->string('tanggal', 255);
            $table->string('nama_obat_alkes', 255);
            $table->string('kode_obat_alkes', 255);
            $table->string('harga', 255);
            $table->string('qty', 255);
            $table->string('total', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('apotek_prebayars');
    }
};

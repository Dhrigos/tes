<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tindakans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode', 255);
            $table->string('nama', 255);
            $table->string('kategori', 255);
            $table->string('tarif_dokter', 255);
            $table->string('tarif_perawat', 255);
            $table->string('tarif_total', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('tindakans');
    }
};

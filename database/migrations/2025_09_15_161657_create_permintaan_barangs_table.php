<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permintaan_barangs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_request', 255);
            $table->string('kode_klinik', 255);
            $table->string('nama_klinik', 255);
            $table->string('status', 255);
            $table->string('tanggal_input', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('permintaan_barangs');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_rujukans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255)->nullable();
            $table->string('no_rawat', 255)->nullable();
            $table->string('penjamin', 255)->nullable();
            $table->string('tujuan_rujukan', 255)->nullable();
            $table->string('opsi_rujukan', 255)->nullable();
            $table->string('tanggal_rujukan', 255)->nullable();
            $table->string('sarana', 255)->nullable();
            $table->string('rujukan_lanjut', 255)->nullable();
            $table->string('sub_spesialis', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_rujukans');
    }
};

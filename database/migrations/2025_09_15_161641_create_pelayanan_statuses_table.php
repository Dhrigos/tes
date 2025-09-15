<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_statuses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_register', 255);
            $table->unsignedBigInteger('pasien_id')->nullable();
            $table->timestamp('tanggal_kujungan')->nullable();
            $table->tinyInteger('status_daftar')->default(0);
            $table->tinyInteger('status_perawat')->default(0);
            $table->tinyInteger('status_dokter')->default(0);
            $table->tinyInteger('status_bidan')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('waktu_panggil_dokter')->nullable();
            $table->timestamp('waktu_panggil_bidan')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_statuses');
    }
};

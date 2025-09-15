<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perawat_pelatihans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('perawat_id');
            $table->string('nama_pelatihan', 255);
            $table->string('penyelenggara', 255)->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->string('nomor_sertifikat', 255)->nullable();
            $table->string('file_sertifikat', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['perawat_id'], 'perawat_pelatihans_perawat_id_index');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('perawat_pelatihans');
    }
};

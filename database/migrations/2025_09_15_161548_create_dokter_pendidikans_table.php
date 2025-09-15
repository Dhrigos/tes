<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokter_pendidikans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('dokter_id');
            $table->string('jenjang', 255);
            $table->string('institusi', 255)->nullable();
            $table->string('tahun_lulus', 255)->nullable();
            $table->string('nomor_ijazah', 255)->nullable();
            $table->string('file_ijazah', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['dokter_id'], 'dokter_pendidikans_dokter_id_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('dokter_pendidikans');
    }
};

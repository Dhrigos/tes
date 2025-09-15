<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perawat_pendidikans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('perawat_id');
            $table->string('jenjang', 255);
            $table->string('institusi', 255)->nullable();
            $table->string('tahun_lulus', 10)->nullable();
            $table->string('nomor_ijazah', 255)->nullable();
            $table->string('file_ijazah', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['perawat_id'], 'perawat_pendidikans_perawat_id_index');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('perawat_pendidikans');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokter_jadwals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('dokter_id');
            $table->string('hari', 255);
            $table->time('jam_mulai')->nullable();
            $table->time('jam_selesai')->nullable();
            $table->unsignedInteger('kuota')->default(0);
            $table->boolean('aktif')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['dokter_id'], 'dokter_jadwals_dokter_id_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('dokter_jadwals');
    }
};

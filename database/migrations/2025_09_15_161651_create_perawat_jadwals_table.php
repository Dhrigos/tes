<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perawat_jadwals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('perawat_id');
            $table->string('hari', 20);
            $table->time('jam_mulai')->nullable();
            $table->time('jam_selesai')->nullable();
            $table->integer('kuota')->default(0);
            $table->boolean('aktif')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['perawat_id', 'hari'], 'perawat_jadwals_perawat_id_hari_index');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('perawat_jadwals');
    }
};

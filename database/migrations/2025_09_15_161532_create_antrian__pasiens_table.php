<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('antrian__pasiens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('pasien_id');
            $table->string('prefix', 255);
            $table->integer('nomor');
            $table->date('tanggal')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['pasien_id'], 'antrian_pasiens_pasien_id_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('antrian__pasiens');
    }
};

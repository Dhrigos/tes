<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255);
            $table->string('pasien_id', 255);
            $table->string('nomor_register', 255);
            $table->date('tanggal_kujungan');
            $table->string('poli_id', 255);
            $table->string('dokter_id', 255);
            $table->string('kunjungan', 255)->nullable();
            $table->string('status', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanans');
    }
};

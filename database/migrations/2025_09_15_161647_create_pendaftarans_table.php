<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftarans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255);
            $table->string('pasien_id', 255);
            $table->string('nomor_register', 255);
            $table->string('tanggal_kujungan', 255);
            $table->string('poli_id', 255);
            $table->string('dokter_id', 255);
            $table->string('Penjamin', 255);
            $table->string('antrian', 255)->nullable();
            $table->string('no_urut', 255)->nullable();
            $table->text('alasan_batal')->nullable();
            $table->string('status', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftarans');
    }
};

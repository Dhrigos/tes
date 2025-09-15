<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perawats', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nama', 255);
            $table->string('profile', 255)->nullable();
            $table->string('nik', 255);
            $table->string('npwp', 255);
            $table->date('tgl_masuk');
            $table->integer('status_pegawaian')->nullable();
            $table->string('tempat_lahir', 255)->nullable();
            $table->string('tanggal_lahir', 255)->nullable();
            $table->string('alamat', 255)->nullable();
            $table->integer('rt')->nullable();
            $table->integer('rw')->nullable();
            $table->integer('kode_pos')->nullable();
            $table->string('kewarganegaraan', 255);
            $table->string('seks', 255)->nullable();
            $table->string('agama', 255)->nullable();
            $table->string('pendidikan', 255)->nullable();
            $table->unsignedBigInteger('goldar')->nullable();
            $table->string('pernikahan', 255)->nullable();
            $table->string('telepon', 255)->nullable();
            $table->string('provinsi_kode', 255)->nullable();
            $table->string('kabupaten_kode', 255)->nullable();
            $table->string('kecamatan_kode', 255)->nullable();
            $table->string('desa_kode', 255)->nullable();
            $table->integer('suku')->nullable();
            $table->integer('bahasa')->nullable();
            $table->integer('bangsa')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->integer('verifikasi')->nullable();
            $table->unsignedBigInteger('users')->nullable();
            $table->index(['users'], 'perawats_users_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('perawats');
    }
};

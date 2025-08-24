<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('dokters', function (Blueprint $table) {
            $table->id();
            $table->string('nik');
            $table->string('poli');
            $table->string('npwp');
            $table->string('kode')->nullable();
            $table->string('kode_satu')->nullable();
            $table->date('tgl_masuk');
            $table->integer('status_pegawaian')->nullable();
            $table->string('sip')->nullable();
            $table->string('exp_spri')->nullable();
            $table->string('str')->nullable();
            $table->string('exp_str')->nullable();
            $table->string('tempat_lahir')->nullable();
            $table->string('tanggal_lahir')->nullable();
            $table->string('alamat')->nullable();
            $table->integer('rt')->nullable();
            $table->integer('rw')->nullable();
            $table->integer('kode_pos')->nullable();
            $table->string('kewarganegaraan');
            $table->string('seks')->nullable();
            $table->string('agama')->nullable();
            $table->string('pendidikan')->nullable();
            $table->foreignId('goldar')->nullable();
            $table->string('pernikahan')->nullable();
            $table->string('telepon')->nullable();
            $table->string('provinsi_kode')->nullable();
            $table->string('kabupaten_kode')->nullable();
            $table->string('kecamatan_kode')->nullable();
            $table->string('desa_kode')->nullable();
            $table->integer('suku')->nullable();
            $table->integer('bahasa')->nullable();
            $table->integer('bangsa')->nullable();
            $table->integer('verifikasi')->nullable();
            $table->integer('users')->nullable();
            $table->integer('user_id_input')->nullable();
            $table->string('user_name_input')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dokters');
    }
};

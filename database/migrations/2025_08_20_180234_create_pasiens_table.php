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
        Schema::create('pasiens', function (Blueprint $table) {
            $table->id();
            $table->string('no_rm')->unique();
            $table->string('nik');
            $table->string('nama');
            $table->string('tempat_lahir')->nullable();
            $table->string('tanggal_lahir')->nullable();
            $table->string('kode_ihs')->nullable();
            $table->string('no_bpjs')->nullable();
            $table->string('tgl_exp_bpjs')->nullable();
            $table->string('kelas_bpjs')->nullable();
            $table->string('jenis_peserta_bpjs')->nullable();
            $table->string('provide')->nullable();
            $table->string('kodeprovide')->nullable();
            $table->string('hubungan_keluarga')->nullable();
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
            $table->string('pekerjaan')->nullable();
            $table->string('telepon')->nullable();
            $table->string('provinsi_kode')->nullable();
            $table->string('kabupaten_kode')->nullable();
            $table->string('kecamatan_kode')->nullable();
            $table->string('desa_kode')->nullable();
            $table->integer('suku')->nullable();
            $table->integer('bahasa')->nullable();
            $table->integer('bangsa')->nullable();
            $table->integer('verifikasi')->nullable();
            $table->string('penjamin_2_nama')->nullable();
            $table->string('penjamin_2_no')->nullable();
            $table->string('penjamin_3_nama')->nullable();
            $table->string('penjamin_3_no')->nullable();
            $table->string('foto')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pasiens');
    }
};

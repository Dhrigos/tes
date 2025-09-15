<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pasiens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->char('uuid', 36);
            $table->string('no_rm', 255);
            $table->string('nik', 255);
            $table->string('nama', 255);
            $table->string('tempat_lahir', 255)->nullable();
            $table->string('tanggal_lahir', 255)->nullable();
            $table->string('kode_ihs', 255)->nullable();
            $table->string('no_bpjs', 255)->nullable();
            $table->string('tgl_exp_bpjs', 255)->nullable();
            $table->string('kelas_bpjs', 255)->nullable();
            $table->string('jenis_peserta_bpjs', 255)->nullable();
            $table->string('provide', 255)->nullable();
            $table->string('kodeprovide', 255)->nullable();
            $table->string('hubungan_keluarga', 255)->nullable();
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
            $table->string('pekerjaan', 255)->nullable();
            $table->string('telepon', 255)->nullable();
            $table->string('provinsi_kode', 255)->nullable();
            $table->string('kabupaten_kode', 255)->nullable();
            $table->string('kecamatan_kode', 255)->nullable();
            $table->string('desa_kode', 255)->nullable();
            $table->integer('suku')->nullable();
            $table->integer('bahasa')->nullable();
            $table->integer('bangsa')->nullable();
            $table->integer('verifikasi')->nullable();
            $table->string('penjamin_2_nama', 255)->nullable();
            $table->string('penjamin_2_no', 255)->nullable();
            $table->string('penjamin_3_nama', 255)->nullable();
            $table->string('penjamin_3_no', 255)->nullable();
            $table->string('foto', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['no_rm']);
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pasiens');
    }
};

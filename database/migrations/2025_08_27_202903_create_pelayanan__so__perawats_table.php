<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pelayanan_so_perawats', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('seks');
            $table->string('penjamin');
            $table->date('tanggal_lahir');
            $table->string('umur');
            $table->json('tableData')->nullable();
            $table->string('sistol')->nullable();
            $table->string('distol')->nullable();
            $table->string('tensi')->nullable();
            $table->string('suhu')->nullable();
            $table->string('nadi')->nullable();
            $table->string('rr')->nullable();
            $table->string('tinggi')->nullable();
            $table->string('berat')->nullable();
            $table->string('spo2')->nullable();
            $table->string('lingkar_perut')->nullable();
            $table->string('nilai_bmi')->nullable();
            $table->string('status_bmi')->nullable();
            $table->string('jenis_alergi')->nullable();
            $table->string('alergi')->nullable();
            $table->tinyInteger('eye')->nullable();
            $table->tinyInteger('verbal')->nullable();
            $table->tinyInteger('motorik')->nullable();
            $table->longText('summernote')->nullable();
            $table->string('files')->nullable();
            $table->string('user_input_id');
            $table->string('user_input_name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_so_perawats');
    }
};

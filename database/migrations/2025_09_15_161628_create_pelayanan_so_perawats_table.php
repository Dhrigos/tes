<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_so_perawats', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255);
            $table->string('nama', 255);
            $table->string('no_rawat', 255);
            $table->string('seks', 255);
            $table->string('penjamin', 255);
            $table->date('tanggal_lahir');
            $table->string('umur', 255);
            $table->longText('tableData')->nullable();
            $table->string('sistol', 255)->nullable();
            $table->string('distol', 255)->nullable();
            $table->string('tensi', 255)->nullable();
            $table->string('suhu', 255)->nullable();
            $table->string('nadi', 255)->nullable();
            $table->string('rr', 255)->nullable();
            $table->string('tinggi', 255)->nullable();
            $table->string('berat', 255)->nullable();
            $table->string('spo2', 255)->nullable();
            $table->string('lingkar_perut', 255)->nullable();
            $table->string('nilai_bmi', 255)->nullable();
            $table->string('status_bmi', 255)->nullable();
            $table->string('jenis_alergi', 255)->nullable();
            $table->string('alergi', 255)->nullable();
            $table->tinyInteger('eye')->nullable();
            $table->tinyInteger('verbal')->nullable();
            $table->tinyInteger('motorik')->nullable();
            $table->string('kesadaran', 255)->nullable();
            $table->longText('summernote')->nullable();
            $table->string('files', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_so_perawats');
    }
};

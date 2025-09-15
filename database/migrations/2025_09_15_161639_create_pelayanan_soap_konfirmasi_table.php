<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_soap_konfirmasi', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255);
            $table->string('nama', 255);
            $table->string('no_rawat', 255);
            $table->string('seks', 255)->nullable();
            $table->string('penjamin', 255)->nullable();
            $table->string('tanggal_lahir', 255)->nullable();
            $table->string('umur', 255)->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['nomor_rm'], 'pelayanan_soap_konfirmasi_nomor_rm_index');
            $table->index(['no_rawat'], 'pelayanan_soap_konfirmasi_no_rawat_index');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_konfirmasi');
    }
};

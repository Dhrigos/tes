<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pelayanan_soap_bidan_diets', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('seks')->nullable();
            $table->string('penjamin')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('jenis_diet');
            $table->string('jenis_diet_makanan')->nullable();
            $table->string('jenis_diet_makanan_tidak')->nullable();
            $table->timestamps();
        });

        Schema::create('pelayanan_soap_bidan_icds', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('seks')->nullable();
            $table->string('penjamin')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('nama_icd10')->nullable();
            $table->string('kode_icd10')->nullable();
            $table->string('priority_icd10')->nullable();
            $table->string('nama_icd9')->nullable();
            $table->string('kode_icd9')->nullable();
            $table->timestamps();
        });

        Schema::create('pelayanan_soap_bidan_tindakans', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('seks')->nullable();
            $table->string('penjamin')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('kode_tindakan');
            $table->string('jenis_tindakan');
            $table->string('kategori_tindakan')->nullable();
            $table->string('jenis_pelaksana')->nullable();
            $table->string('harga')->default('0');
            $table->tinyInteger('status_kasir')->default(0);
            $table->timestamps();
        });

        Schema::create('pelayanan_soap_bidan_obats', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('seks')->nullable();
            $table->string('penjamin')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('penanda')->nullable();
            $table->string('nama_obat');
            $table->string('instruksi')->nullable();
            $table->string('signa')->nullable();
            $table->string('satuan_gudang')->nullable();
            $table->string('penggunaan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_bidan_obats');
        Schema::dropIfExists('pelayanan_soap_bidan_tindakans');
        Schema::dropIfExists('pelayanan_soap_bidan_icds');
        Schema::dropIfExists('pelayanan_soap_bidan_diets');
    }
};

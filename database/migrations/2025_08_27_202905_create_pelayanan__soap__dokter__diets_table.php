<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pelayanan_soap_dokter_diets', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('seks');
            $table->string('penjamin');
            $table->date('tanggal_lahir');
            $table->string('jenis_diet')->nullable();
            $table->string('jenis_diet_makanan')->nullable();
            $table->string('jenis_diet_makanan_tidak')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_dokter_diets');
    }
};

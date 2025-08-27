<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pelayanan_rujukans', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm')->nullable();
            $table->string('no_rawat')->nullable();
            $table->string('penjamin')->nullable();
            $table->string('tujuan_rujukan')->nullable();
            $table->string('opsi_rujukan')->nullable();
            $table->string('tanggal_rujukan')->nullable();
            $table->string('sarana')->nullable();
            $table->string('rujukan_lanjut')->nullable();
            $table->string('sub_spesialis')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_rujukans');
    }
};
